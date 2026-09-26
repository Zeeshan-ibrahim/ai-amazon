import { pool, withTransaction } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';
import { recordSettlement } from './transactions.js';

const TAB_FOR_STATUS = { assigned: 'purchase', purchased: 'sell', completed: 'completed' };
const round2 = (n) => Math.round(n * 100) / 100;

const profitOf = (row) => round2((row.price * row.profit_percentage) / 100);
/** What selling pays back: the price plus the profit. */
const totalReturnOf = (row) => round2(row.price + profitOf(row));

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

export async function listOrdersForUser(userId) {
  const { rows } = await pool.query(
    `SELECT o.*, p.title, p.image_url
       FROM orders o JOIN products p ON p.id = o.product_id
      WHERE o.user_id = $1
      ORDER BY o.assigned_at ASC`,
    [userId]
  );
  return rows;
}

/** Copies the product's current price/profit onto a new order. `null` if the product is unavailable. */
export async function assignOrder(db, { userId, productId, adminId }) {
  const { rows } = await db.query(
    `INSERT INTO orders (user_id, product_id, price, profit_percentage, assigned_by)
     SELECT $1, p.id, p.price, p.profit_percentage, $3
       FROM products p WHERE p.id = $2 AND p.is_active
     RETURNING *`,
    [userId, productId, adminId]
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

/**
 * Moves an order one step along and settles it in the same transaction:
 * the status change, the balance movement, the ledger row and the audit
 * entry all commit together. Returns `null` if the order isn't in `from`.
 */
function settle({ orderId, userId, from, to, stampColumn, type, amountOf, audit }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `UPDATE orders SET status = $3, ${stampColumn} = now()
        WHERE id = $1 AND user_id = $2 AND status = $4
        RETURNING *`,
      [orderId, userId, to, from]
    );
    const order = rows[0];
    if (!order) return null;

    const amount = amountOf(order);
    const { transaction, balance } = await recordSettlement(db, {
      userId,
      orderId,
      type,
      amount,
    });
    await recordAudit(db, {
      actorId: userId,
      targetUserId: userId,
      action: audit,
      details: { orderId, transactionId: transaction.id, amount, balance },
    });
    return order;
  });
}

/** Debits the price and moves the order to the Sell tab. */
export const purchaseOrder = (orderId, userId) =>
  settle({
    orderId,
    userId,
    from: 'assigned',
    to: 'purchased',
    stampColumn: 'purchased_at',
    type: 'order_purchase',
    amountOf: (order) => order.price,
    audit: AUDIT.ORDER_PURCHASED,
  });

/** Credits price + profit and moves the order to Completed. */
export const sellOrder = (orderId, userId) =>
  settle({
    orderId,
    userId,
    from: 'purchased',
    to: 'completed',
    stampColumn: 'completed_at',
    type: 'order_sale',
    amountOf: totalReturnOf,
    audit: AUDIT.ORDER_SOLD,
  });
