/**
 * Admin-side access to users ("members"). A super-admin sees every account;
 * a sub-admin (`ownerId`) only the traders they own — see docs/roles.md.
 */
import { pool } from '../db/pool.js';
import { ADDED_BY_COLUMNS, addedByJoin, addedByOf, hashSecret, normalizeEmail, ROLES, toPublicUser } from './users.js';

const SELECT_MEMBER = `
  SELECT u.*, ${ADDED_BY_COLUMNS}, EXISTS (
           SELECT 1 FROM transactions t
            WHERE t.user_id = u.id AND t.type = 'deposit' AND t.status = 'approved'
         ) AS has_approved_deposit
    FROM users u ${addedByJoin('u')}`;

export const toMember = (row) => ({
  ...toPublicUser(row),
  inviteCode: row.invite_code,
  withdrawalLimit: row.withdrawal_limit,
  lastLoginAt: row.last_login_at,
  hasApprovedDeposit: row.has_approved_deposit ?? false,
  addedBy: addedByOf(row),
});

/**
 * Newest first. `q` matches name, username, either email or the invite code.
 * `ownerId` limits it to that sub-admin's traders. `createdBy` is the
 * super-admin's "Added by" filter: a sub-admin's id, or null for accounts
 * the super-admin owns.
 */
export async function listMembers({ q, limit = 50, offset = 0, ownerId = null, createdBy }) {
  const params = [];
  const where = [];
  if (q) {
    params.push(`%${q.replace(/^@/, '')}%`);
    where.push(`(u.email ILIKE $1 OR u.contact_email ILIKE $1 OR u.username ILIKE $1
                OR (u.first_name || ' ' || u.last_name) ILIKE $1 OR u.invite_code ILIKE $1)`);
  }
  if (ownerId) {
    params.push(ownerId);
    where.push(`u.created_by = $${params.length} AND u.role = '${ROLES.USER}'`);
  }
  if (createdBy !== undefined) {
    params.push(createdBy);
    where.push(`u.created_by IS NOT DISTINCT FROM $${params.length}::uuid`);
  }
  const filter = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `${SELECT_MEMBER} ${filter} ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT count(*)::int AS total FROM users u ${filter}`, params),
  ]);
  return { total: countRows[0].total, items: rows.map(toMember) };
}

/** The member row, or null if unknown — or, for a sub-admin (`ownerId`), not one of theirs. */
export async function getMemberRow(id, db = pool, { ownerId = null } = {}) {
  const { rows } = await db.query(
    `${SELECT_MEMBER} WHERE u.id = $1
       AND ($2::uuid IS NULL OR (u.created_by = $2 AND u.role = '${ROLES.USER}'))`,
    [id, ownerId]
  );
  return rows[0] ?? null;
}

/**
 * API field → column, for fields an admin may edit. The route decides who
 * may send `role`, `status` and `ownerId` (super-admins only).
 */
const ADMIN_EDITABLE = {
  firstName: 'first_name',
  lastName: 'last_name',
  username: 'username',
  phone: 'phone',
  email: 'email',
  role: 'role',
  status: 'status',
  ownerId: 'created_by',
  withdrawalLimit: 'withdrawal_limit',
};

/** Fields whose values are passed through untrimmed. */
const RAW_FIELDS = ['role', 'status', 'ownerId'];

/**
 * Applies already-validated `changes` (plus an optional new `password`) and
 * returns `{ row, diff }`, where `diff` lists changed fields as
 * `{ field: { from, to } }`. The password is reported as changed, never valued.
 */
export async function updateMember(db, id, before, changes) {
  const sets = [];
  const values = [];
  const diff = {};

  for (const [field, column] of Object.entries(ADMIN_EDITABLE)) {
    if (changes[field] === undefined) continue;
    let value = changes[field];
    if (field === 'email') value = normalizeEmail(value);
    if (field === 'username') value = String(value).trim().replace(/^@/, '') || null;
    if (typeof value === 'string' && !RAW_FIELDS.includes(field)) value = value.trim();
    if (value === before[column]) continue;

    values.push(value);
    sets.push(`${column} = $${values.length}`);
    diff[field] = { from: before[column], to: value };
  }

  if (changes.password) {
    values.push(await hashSecret(changes.password));
    sets.push(`password_hash = $${values.length}`);
    diff.password = { changed: true };
  }

  if (sets.length) {
    values.push(id);
    await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}`, values);
  }
  return { row: await getMemberRow(id, db), diff };
}

/**
 * Hands everything a sub-admin owns — traders, plans, products — back to the
 * super-admin. Runs when a sub-admin changes role or is deleted. Returns how
 * many of each moved, for the audit log.
 */
export async function releaseOwned(db, subAdminId) {
  const counts = {};
  for (const table of ['users', 'plans', 'products']) {
    const { rowCount } = await db.query(`UPDATE ${table} SET created_by = NULL WHERE created_by = $1`, [
      subAdminId,
    ]);
    counts[table] = rowCount;
  }
  return counts;
}

/** An active sub-admin's row, for checking an `ownerId` before assigning it. */
export async function findActiveSubAdmin(id, db = pool) {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE id = $1 AND role = '${ROLES.SUB_ADMIN}' AND status = 'active'`,
    [id]
  );
  return rows[0] ?? null;
}
