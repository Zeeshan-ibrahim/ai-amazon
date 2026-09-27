import { pool } from '../db/pool.js';

/**
 * Group-wide figures for the admin overview. `totalVolume` is the money
 * members hold right now — the sum of their balances, which always equals
 * their approved ledger — so deposits, withdrawals, adjustments, orders and
 * plans all move it. `approvedDeposits` is the all-time total paid in.
 *
 * For a sub-admin (`ownerId`) every figure covers only their own traders,
 * and `activeProducts` the products they can assign (shared + their own).
 * A super-admin's pending counts include sub-admins' own requests.
 */
export async function getOverview({ ownerId = null } = {}) {
  const members = `SELECT id FROM users WHERE role = 'user' AND ($1::uuid IS NULL OR created_by = $1)`;
  // Whose requests this admin reviews: a super-admin also reviews sub-admins'.
  const reviewable = `SELECT id FROM users
    WHERE ($1::uuid IS NULL AND role <> 'super_admin') OR (created_by = $1 AND role = 'user')`;
  const { rows } = await pool.query(
    `SELECT
      (SELECT count(*)::int FROM (${members}) m) AS members,
      (SELECT count(*)::int FROM products
        WHERE is_active AND ($1::uuid IS NULL OR created_by IS NULL OR created_by = $1)) AS active_products,
      (SELECT count(*)::int FROM transactions
        WHERE type = 'deposit' AND status = 'pending' AND user_id IN (${reviewable})) AS pending_deposits,
      (SELECT count(*)::int FROM transactions
        WHERE type = 'withdrawal' AND status = 'pending' AND user_id IN (${reviewable})) AS pending_withdrawals,
      (SELECT COALESCE(sum(balance), 0) FROM users WHERE id IN (${members})) AS total_volume,
      (SELECT COALESCE(sum(amount), 0) FROM transactions
        WHERE type = 'deposit' AND status = 'approved' AND user_id IN (${members})) AS approved_deposits`,
    [ownerId]
  );
  const row = rows[0];
  return {
    members: row.members,
    activeProducts: row.active_products,
    pendingDeposits: row.pending_deposits,
    pendingWithdrawals: row.pending_withdrawals,
    totalVolume: row.total_volume,
    approvedDeposits: row.approved_deposits,
  };
}

/** Live checks for the System Diagnostics panel. */
export async function getDiagnostics() {
  const started = performance.now();
  try {
    const { rows } = await pool.query(
      'SELECT name, applied_at FROM schema_migrations ORDER BY name DESC LIMIT 1'
    );
    return {
      database: { connected: true, latencyMs: Math.round(performance.now() - started) },
      schema: rows[0] ? { version: rows[0].name.replace(/\.sql$/, ''), appliedAt: rows[0].applied_at } : null,
    };
  } catch {
    return { database: { connected: false, latencyMs: null }, schema: null };
  }
}
