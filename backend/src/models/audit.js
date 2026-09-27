import { pool } from '../db/pool.js';

/**
 * Action names, `<subject>.<verb>`. The admin UI maps these to labels, so
 * add new ones here rather than inventing strings at call sites.
 */
export const AUDIT = Object.freeze({
  MEMBER_CREATED: 'member.created',
  MEMBER_UPDATED: 'member.updated',
  SUB_ADMIN_RELEASED: 'subadmin.released',
  SUB_ADMIN_DELETED: 'subadmin.deleted',
  ORDER_ASSIGNED: 'order.assigned',
  ORDER_PURCHASED: 'order.purchased',
  ORDER_SOLD: 'order.sold',
  ORDER_UPDATED: 'order.updated',
  ORDER_REMOVED: 'order.removed',
  PLAN_ACTIVATED: 'plan.activated',
  PLAN_APPROVED: 'plan.approved',
  PLAN_REJECTED: 'plan.rejected',
  BALANCE_ADJUSTED: 'balance.adjusted',
  DEPOSIT_REQUESTED: 'deposit.requested',
  WITHDRAWAL_REQUESTED: 'withdrawal.requested',
  TRANSACTION_APPROVED: 'transaction.approved',
  TRANSACTION_REJECTED: 'transaction.rejected',
});

/** Pass the same client as the change being audited so both commit together. */
export async function recordAudit(db, { actorId, targetUserId, action, details = {} }) {
  await db.query(
    `INSERT INTO audit_logs (actor_id, target_user_id, action, details)
     VALUES ($1, $2, $3, $4)`,
    [actorId, targetUserId, action, details]
  );
}

export async function listAuditsForUser(userId, limit = 200) {
  const { rows } = await pool.query(
    `SELECT a.*, u.username AS actor_username, u.email AS actor_email, u.role AS actor_role
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.actor_id
      WHERE a.target_user_id = $1
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT $2`,
    [userId, limit]
  );
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: row.details,
    createdAt: row.created_at,
    actor: row.actor_id
      ? {
          id: row.actor_id,
          handle: row.actor_username || row.actor_email.split('@')[0],
          role: row.actor_role,
        }
      : null,
  }));
}
