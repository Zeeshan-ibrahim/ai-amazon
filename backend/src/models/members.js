/** Admin-side access to users ("members"). */
import { pool } from '../db/pool.js';
import { hashSecret, normalizeEmail, toPublicUser } from './users.js';

const SELECT_MEMBER = `
  SELECT u.*, EXISTS (
           SELECT 1 FROM transactions t
            WHERE t.user_id = u.id AND t.type = 'deposit' AND t.status = 'approved'
         ) AS has_approved_deposit
    FROM users u`;

export const toMember = (row) => ({
  ...toPublicUser(row),
  inviteCode: row.invite_code,
  withdrawalLimit: row.withdrawal_limit,
  lastLoginAt: row.last_login_at,
  hasApprovedDeposit: row.has_approved_deposit ?? false,
});

/** Newest first. `q` matches name, username, either email or the invite code. */
export async function listMembers({ q, limit = 50, offset = 0 }) {
  const params = [];
  let where = '';
  if (q) {
    params.push(`%${q.replace(/^@/, '')}%`);
    where = `WHERE u.email ILIKE $1 OR u.contact_email ILIKE $1 OR u.username ILIKE $1
                OR (u.first_name || ' ' || u.last_name) ILIKE $1 OR u.invite_code ILIKE $1`;
  }
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `${SELECT_MEMBER} ${where} ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT count(*)::int AS total FROM users u ${where}`, params),
  ]);
  return { total: countRows[0].total, items: rows.map(toMember) };
}

export async function getMemberRow(id, db = pool) {
  const { rows } = await db.query(`${SELECT_MEMBER} WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

/** API field → column, for fields an admin may edit. */
const ADMIN_EDITABLE = {
  firstName: 'first_name',
  lastName: 'last_name',
  username: 'username',
  phone: 'phone',
  email: 'email',
  role: 'role',
  withdrawalLimit: 'withdrawal_limit',
};

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
    if (typeof value === 'string' && field !== 'role') value = value.trim();
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
