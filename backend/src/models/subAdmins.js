/** The super-admin's Sub-admins page. See docs/roles.md. */
import { pool, withTransaction } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';
import { LedgerError } from './transactions.js';
import { ROLES, toPublicUser } from './users.js';

const SELECT_SUB_ADMIN = `
  SELECT u.*,
         (SELECT count(*)::int FROM users m
           WHERE m.created_by = u.id AND m.role = 'user') AS member_count,
         (SELECT COALESCE(sum(m.balance), 0) FROM users m
           WHERE m.created_by = u.id AND m.role = 'user') AS member_balance,
         (SELECT count(*)::int FROM plans p WHERE p.created_by = u.id AND p.is_active) AS plan_count,
         (SELECT count(*)::int FROM products p WHERE p.created_by = u.id AND p.is_active) AS product_count,
         (SELECT count(*)::int FROM transactions t
           WHERE t.user_id = u.id AND t.status = 'pending') AS pending_requests
    FROM users u
   WHERE u.role = '${ROLES.SUB_ADMIN}'`;

export const toSubAdmin = (row) => ({
  ...toPublicUser(row),
  inviteCode: row.invite_code,
  lastLoginAt: row.last_login_at,
  stats: {
    members: row.member_count,
    memberBalance: row.member_balance,
    plans: row.plan_count,
    products: row.product_count,
    /** The sub-admin's own deposit/withdrawal requests awaiting a super-admin. */
    pendingRequests: row.pending_requests,
  },
});

/** Newest first. */
export async function listSubAdmins() {
  const { rows } = await pool.query(`${SELECT_SUB_ADMIN} ORDER BY u.created_at DESC`);
  return rows.map(toSubAdmin);
}

export async function getSubAdmin(id) {
  const { rows } = await pool.query(`${SELECT_SUB_ADMIN} AND u.id = $1`, [id]);
  return rows[0] ? toSubAdmin(rows[0]) : null;
}

/**
 * Deletes a sub-admin. Their traders, plans and products go back to the
 * super-admin through `created_by … ON DELETE SET NULL`. Refused while they
 * hold a balance or have a pending request, so no money disappears with the
 * account. Returns what was handed back, or null for an unknown sub-admin.
 */
export function deleteSubAdmin({ id, actorId }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `SELECT u.*, EXISTS (
                SELECT 1 FROM transactions t WHERE t.user_id = u.id AND t.status = 'pending'
              ) AS has_pending
         FROM users u WHERE u.id = $1 AND u.role = '${ROLES.SUB_ADMIN}' FOR UPDATE`,
      [id]
    );
    const row = rows[0];
    if (!row) return null;
    if (row.balance > 0) {
      throw new LedgerError(409, 'This sub-admin still holds a balance. Settle it to 0 before deleting.');
    }
    if (row.has_pending) {
      throw new LedgerError(409, 'This sub-admin has a pending deposit or withdrawal. Review it first.');
    }

    const counts = {};
    for (const table of ['users', 'plans', 'products']) {
      const { rows: n } = await db.query(`SELECT count(*)::int AS n FROM ${table} WHERE created_by = $1`, [id]);
      counts[table] = n[0].n;
    }
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    // The target row is gone, so the entry is kept on the actor's side only.
    await recordAudit(db, {
      actorId,
      targetUserId: null,
      action: AUDIT.SUB_ADMIN_DELETED,
      details: { subAdminId: id, email: row.email, handedBack: counts },
    });
    return counts;
  });
}
