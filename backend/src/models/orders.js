import { pool } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';

const TAB_FOR_STATUS = { assigned: 'purchase', purchased: 'sell', completed: 'completed' };
const round2 = (n) => Math.round(n * 100) / 100;

/** The trader's view — matches `Product` in frontend/src/lib/types.ts. */
export function toTraderOrder(row) {
  const expectedProfit = round2((row.price * row.profit_percentage) / 100);
  return {
    id: row.id,
    name: row.title,
    image: row.image_url,
    amount: row.price,
    profitPercentage: row.profit_percentage,
    expectedProfit,
    totalReturn: round2(row.price + expectedProfit),
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

/** Moves an assigned order to the Sell tab. Returns the updated row, or null. */
export async function markPurchased(orderId, userId) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'purchased', purchased_at = now()
      WHERE id = $1 AND user_id = $2 AND status = 'assigned'
      RETURNING *`,
    [orderId, userId]
  );
  return rows[0] ?? null;
}
