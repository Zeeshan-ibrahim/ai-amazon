import { pool, withTransaction } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';
import { LedgerError, recordSettlement } from './transactions.js';

const TAB_FOR_STATUS = { assigned: 'purchase', purchased: 'sell', completed: 'completed' };
export const ORDER_STATUSES = Object.keys(TAB_FOR_STATUS);

/**
 * Profit in whole cents, from the price (2dp) and percentage (3dp) as exact
 * integers, rounded half-up — floats would drift on half-cent results.
 * Keep in step with `orderProfit` in frontend/src/lib/format.ts.
 */
const profitCentsOf = (row) => {
  const cents = BigInt(Math.round(row.price * 100));
  const milli = BigInt(Math.round(row.profit_percentage * 1000));
  return Number((cents * milli + 50_000n) / 100_000n);
};
const profitOf = (row) => profitCentsOf(row) / 100;
/** What selling pays back: the price plus the profit. */
const totalReturnOf = (row) => (Math.round(row.price * 100) + profitCentsOf(row)) / 100;

/** The trader's view — matches `Product` in frontend/src/lib/types.ts. */
export function toTraderOrder(row) {
  const expectedProfit = profitOf(row);
  return {
    id: row.id,
    name: row.title,
    image: row.image_url,
    amount: row.price,
    profitPercentage: row.profit_percentage,
    expectedProfit,
    totalReturn: totalReturnOf(row),
    assignedDate: row.assigned_at,
    ...(row.completed_at && { completedDate: row.completed_at }),
    state: row.status === 'completed' ? 'completed' : 'assigned',
    tab: TAB_FOR_STATUS[row.status],
  };
}

export async function listOrdersForUser(userId, { newestFirst = false } = {}) {
  const { rows } = await pool.query(
    `SELECT o.*, p.title, p.image_url
       FROM orders o JOIN products p ON p.id = o.product_id
      WHERE o.user_id = $1
      ORDER BY o.assigned_at ${newestFirst ? 'DESC' : 'ASC'}`,
    [userId]
  );
  return rows;
}

/**
 * Copies the product's current price/profit onto a new order. `null` if the
 * product is unavailable — or, for a sub-admin (`ownerId`), neither shared
 * nor their own.
 */
export async function assignOrder(db, { userId, productId, adminId, ownerId = null }) {
  const { rows } = await db.query(
    `INSERT INTO orders (user_id, product_id, price, profit_percentage, assigned_by)
     SELECT $1, p.id, p.price, p.profit_percentage, $3
       FROM products p
      WHERE p.id = $2 AND p.is_active
        AND ($4::uuid IS NULL OR p.created_by IS NULL OR p.created_by = $4)
     RETURNING *`,
    [userId, productId, adminId, ownerId]
  );
  const order = rows[0] ?? null;
  if (order) {
    await recordAudit(db, {
      actorId: adminId,
      targetUserId: userId,
      action: AUDIT.ORDER_ASSIGNED,
      details: { orderId: order.id, productId, price: order.price },
    });
  }
  return order;
}

/** The admin's view of a member's order. */
export const toAdminOrder = (row) => ({
  id: row.id,
  productId: row.product_id,
  title: row.title,
  image: row.image_url,
  price: row.price,
  profitPercentage: row.profit_percentage,
  profit: profitOf(row),
  totalReturn: totalReturnOf(row),
  status: row.status,
  assignedAt: row.assigned_at,
  purchasedAt: row.purchased_at,
  completedAt: row.completed_at,
});

/**
 * The two settlement steps. Each debits or credits the balance from the
 * order row as it stands when the step runs, so admin edits made before
 * then are what the trader pays and receives.
 */
const STEPS = {
  purchased: {
    from: 'assigned',
    stampColumn: 'purchased_at',
    type: 'order_purchase',
    amountOf: (order) => order.price,
    audit: AUDIT.ORDER_PURCHASED,
  },
  completed: {
    from: 'purchased',
    stampColumn: 'completed_at',
    type: 'order_sale',
    amountOf: totalReturnOf,
    audit: AUDIT.ORDER_SOLD,
  },
};

/**
 * Moves an order one step along and settles it: the status change, the
 * balance movement, the ledger row and the audit entry all go through `db`
 * together. Returns `null` if the order isn't at the step's starting status.
 */
async function advance(db, { orderId, userId, actorId, to }) {
  const step = STEPS[to];
  const { rows } = await db.query(
    `UPDATE orders SET status = $3, ${step.stampColumn} = now()
      WHERE id = $1 AND user_id = $2 AND status = $4
      RETURNING *`,
    [orderId, userId, to, step.from]
  );
  const order = rows[0];
  if (!order) return null;

  const amount = step.amountOf(order);
  const { transaction, balance } = await recordSettlement(db, {
    userId,
    orderId,
    type: step.type,
    amount,
  });
  await recordAudit(db, {
    actorId,
    targetUserId: userId,
    action: step.audit,
    details: { orderId, transactionId: transaction.id, amount, balance },
  });
  return order;
}

/** Debits the price and moves the order to the Sell tab. */
export const purchaseOrder = (orderId, userId) =>
  withTransaction((db) => advance(db, { orderId, userId, actorId: userId, to: 'purchased' }));

/** Credits price + profit and moves the order to Completed. */
export const sellOrder = (orderId, userId) =>
  withTransaction((db) => advance(db, { orderId, userId, actorId: userId, to: 'completed' }));

const withProduct = (db, order) =>
  db
    .query('SELECT title, image_url FROM products WHERE id = $1', [order.product_id])
    .then(({ rows }) => ({ ...order, ...rows[0] }));

/**
 * Admin edit of a member's order. `price` and `profitPercentage` are applied
 * first, then `status` is walked forward one settled step at a time, so the
 * ledger always matches the order:
 *   - the price is locked once purchased (it's what was debited);
 *   - the profit can change until the order is sold;
 *   - a completed order is final, and status never moves backwards.
 * Throws `LedgerError` for anything refused, including an overdraw.
 */
export function updateOrderByAdmin({ orderId, userId, adminId, price, profitPercentage, status }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, userId]
    );
    let order = rows[0];
    if (!order) throw new LedgerError(404, 'Order not found.');

    const changes = {};
    if (price !== undefined && price !== order.price) changes.price = { from: order.price, to: price };
    if (profitPercentage !== undefined && profitPercentage !== order.profit_percentage) {
      changes.profitPercentage = { from: order.profit_percentage, to: profitPercentage };
    }
    const fromIndex = ORDER_STATUSES.indexOf(order.status);
    const toIndex = status === undefined ? fromIndex : ORDER_STATUSES.indexOf(status);

    if (order.status === 'completed' && (Object.keys(changes).length || toIndex !== fromIndex)) {
      throw new LedgerError(409, 'This order has been sold and settled — it can no longer be edited.');
    }
    if (changes.price && order.status !== 'assigned') {
      throw new LedgerError(409, 'The price is locked once the member has purchased this order.');
    }
    if (toIndex < fromIndex) {
      throw new LedgerError(409, 'An order can’t move back to an earlier status once it has been settled.');
    }

    if (Object.keys(changes).length) {
      ({ rows: [order] } = await db.query(
        `UPDATE orders
            SET price = COALESCE($2, price), profit_percentage = COALESCE($3, profit_percentage)
          WHERE id = $1
          RETURNING *`,
        [orderId, changes.price?.to ?? null, changes.profitPercentage?.to ?? null]
      ));
      await recordAudit(db, {
        actorId: adminId,
        targetUserId: userId,
        action: AUDIT.ORDER_UPDATED,
        details: { orderId, changes },
      });
    }

    for (const to of ORDER_STATUSES.slice(fromIndex + 1, toIndex + 1)) {
      order = await advance(db, { orderId, userId, actorId: adminId, to });
    }
    return withProduct(db, order);
  });
}

/** Removes an order the member hasn't purchased yet; settled orders stay for the ledger. */
export function removeOrderByAdmin({ orderId, userId, adminId }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, userId]
    );
    const order = rows[0];
    if (!order) throw new LedgerError(404, 'Order not found.');
    if (order.status !== 'assigned') {
      throw new LedgerError(409, 'Only orders the member hasn’t purchased yet can be removed.');
    }
    await db.query('DELETE FROM orders WHERE id = $1', [orderId]);
    await recordAudit(db, {
      actorId: adminId,
      targetUserId: userId,
      action: AUDIT.ORDER_REMOVED,
      details: { orderId, productId: order.product_id, price: order.price },
    });
  });
}
