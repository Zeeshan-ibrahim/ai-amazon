import { pool } from '../db/pool.js';

/**
 * Group-wide figures for the admin overview. `totalVolume` is the money
 * members hold right now — the sum of their balances, which always equals
 * their approved ledger — so deposits, withdrawals, adjustments, orders and
 * plans all move it. `approvedDeposits` is the all-time total paid in.
 */
export async function getOverview() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM users WHERE role = 'user') AS members,
      (SELECT count(*)::int FROM products WHERE is_active) AS active_products,
      (SELECT count(*)::int FROM transactions WHERE type = 'deposit' AND status = 'pending') AS pending_deposits,
      (SELECT count(*)::int FROM transactions WHERE type = 'withdrawal' AND status = 'pending') AS pending_withdrawals,
      (SELECT COALESCE(sum(balance), 0) FROM users WHERE role = 'user') AS total_volume,
      (SELECT COALESCE(sum(amount), 0) FROM transactions WHERE type = 'deposit' AND status = 'approved') AS approved_deposits
  `);
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
