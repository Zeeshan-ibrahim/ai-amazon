import bcrypt from 'bcryptjs';
import { pool, query } from '../db/pool.js';

export const ROLES = Object.freeze({
  USER: 'user',
  SUB_ADMIN: 'sub_admin',
  SUPER_ADMIN: 'super_admin',
});

/** Roles that use the admin portal. See docs/roles.md. */
export const ADMIN_ROLES = Object.freeze([ROLES.SUPER_ADMIN, ROLES.SUB_ADMIN]);

const BCRYPT_COST = 12;

export const MIN_PASSWORD_LENGTH = 8;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const hashSecret = (plain) => bcrypt.hash(plain, BCRYPT_COST);
export const verifySecret = (plain, hash) => bcrypt.compare(plain, hash);

export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

/**
 * The only shape a user row ever leaves the API in. Hashes never go out, and
 * the field names match `frontend/src/lib/types.ts` → `User`.
 */
/** "First Last", else the username, else the email's local part. */
export const displayNameOf = ({ first_name, last_name, username, email }) =>
  `${first_name} ${last_name}`.trim() || username || email.split('@')[0];

export function toPublicUser(row) {
  const displayName = displayNameOf(row);

  return {
    id: row.id,
    role: row.role,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName,
    username: row.username ?? '',
    email: row.contact_email ?? row.email,
    loginEmail: row.email,
    phone: row.phone,
    avatar: row.avatar_url,
    language: row.language,
    balance: row.balance,
    doubleLedgerPassword: row.withdrawal_pin_hash !== null,
    createdAt: row.created_at,
  };
}

/**
 * SQL condition: `column` is a trader owned by the sub-admin whose id is
 * bound at `param`. Scopes a sub-admin's queries to their own users.
 */
export const ownedUserSql = (column, param) =>
  `${column} IN (SELECT id FROM users WHERE created_by = ${param} AND role = 'user')`;

/**
 * `{ id, handle }` of the sub-admin who created a row, or null when the
 * super-admin owns it. Needs `created_by` plus `added_by_username` and
 * `added_by_email` from a join on the creator.
 */
export const addedByOf = (row) =>
  row.created_by
    ? { id: row.created_by, handle: row.added_by_username || row.added_by_email.split('@')[0] }
    : null;

/** Join that provides what `addedByOf` reads, for a table aliased `alias`. */
export const addedByJoin = (alias) =>
  `LEFT JOIN users cb ON cb.id = ${alias}.created_by`;
export const ADDED_BY_COLUMNS = 'cb.username AS added_by_username, cb.email AS added_by_email';

export async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [
    normalizeEmail(email),
  ]);
  return rows[0] ?? null;
}

/**
 * `role` defaults to `user`; only trusted callers (admin routes, the admin
 * CLI) pass another. `createdBy` is the owning sub-admin, or null for the
 * super-admin. Pass a transaction client as `db` to create atomically with
 * other writes.
 */
export async function createUser(
  {
    email,
    password,
    firstName = '',
    lastName = '',
    username = null,
    phone = '',
    role = ROLES.USER,
    createdBy = null,
  },
  db = pool
) {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, username, phone, role, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [normalizeEmail(email), await hashSecret(password), firstName, lastName, username, phone, role, createdBy]
  );
  return rows[0];
}

export async function touchLastLogin(id) {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

/** API field → column. Anything not listed here cannot be changed by the owner. */
const EDITABLE_PROFILE_FIELDS = {
  firstName: 'first_name',
  lastName: 'last_name',
  username: 'username',
  phone: 'phone',
  email: 'contact_email',
  language: 'language',
};

export async function updateProfile(id, changes) {
  const sets = [];
  const values = [];
  for (const [field, column] of Object.entries(EDITABLE_PROFILE_FIELDS)) {
    if (changes[field] === undefined) continue;
    const value = String(changes[field]).trim();
    values.push(value === '' && (column === 'username' || column === 'contact_email') ? null : value);
    sets.push(`${column} = $${values.length}`);
  }
  if (!sets.length) return findById(id);

  values.push(id);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

export async function updatePassword(id, newPassword) {
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    await hashSecret(newPassword),
    id,
  ]);
}

export async function updateWithdrawalPin(id, newPin) {
  await query('UPDATE users SET withdrawal_pin_hash = $1 WHERE id = $2', [
    await hashSecret(newPin),
    id,
  ]);
}
