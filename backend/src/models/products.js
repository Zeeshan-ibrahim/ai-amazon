import { pool } from '../db/pool.js';
import { ADDED_BY_COLUMNS, addedByJoin, addedByOf } from './users.js';

/**
 * Products a sub-admin (`$n` = their id) may see and assign: the shared
 * catalog (created_by NULL) plus their own. A super-admin ($n null) sees all.
 */
const visibleTo = (param) => `(${param}::uuid IS NULL OR p.created_by IS NULL OR p.created_by = ${param})`;

export const toCatalogProduct = (row) => ({
  id: row.id,
  title: row.title,
  image: row.image_url,
  price: row.price,
  profitPercentage: row.profit_percentage,
  assigned: row.assigned ?? false,
});

/**
 * Active catalog, filtered for the allocation hub. `q` matches the title, or
 * the start of the price when it's numeric ("500" → $500.00, $5,000.00 …).
 * `assigned` is whether `forUserId` already has an open order for it.
 * `ownerId` limits it to what that sub-admin may assign.
 */
export async function listCatalog({ forUserId, q, min, max, limit = 30, offset = 0, ownerId = null }) {
  // Filter params come first so the count query can reuse them as-is.
  const where = ['p.is_active'];
  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  if (ownerId) where.push(visibleTo(add(ownerId)));

  if (q) {
    const conditions = [`p.title ILIKE ${add(`%${q}%`)}`];
    const numeric = q.replace(/[$,\s]/g, '');
    if (/^\d+(\.\d+)?$/.test(numeric)) {
      conditions.push(`p.price::text LIKE ${add(`${numeric}%`)}`);
    }
    where.push(`(${conditions.join(' OR ')})`);
  }
  if (min !== undefined) where.push(`p.price >= ${add(min)}`);
  if (max !== undefined) where.push(`p.price < ${add(max)}`);

  const filter = where.join(' AND ');
  const filterParams = [...params];
  const user = add(forUserId);

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT p.*, EXISTS (
                SELECT 1 FROM orders o
                 WHERE o.product_id = p.id AND o.user_id = ${user} AND o.status <> 'completed'
              ) AS assigned
         FROM products p
        WHERE ${filter}
        ORDER BY p.created_at DESC, p.id
        LIMIT ${add(limit)} OFFSET ${add(offset)}`,
      params
    ),
    pool.query(`SELECT count(*)::int AS total FROM products p WHERE ${filter}`, filterParams),
  ]);

  return { total: countRows[0].total, items: rows.map(toCatalogProduct) };
}

/**
 * `addedBy` is the sub-admin who created it (null = super-admin, the shared
 * catalog). `editable` is whether the viewer may change it: a sub-admin
 * (`ownerId`) only their own, a super-admin everything.
 */
export const toAdminProduct = (row, ownerId = null) => ({
  id: row.id,
  title: row.title,
  image: row.image_url,
  description: row.description,
  price: row.price,
  profitPercentage: row.profit_percentage,
  addedBy: addedByOf(row),
  editable: !ownerId || row.created_by === ownerId,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const SELECT_PRODUCT = `SELECT p.*, ${ADDED_BY_COLUMNS} FROM products p ${addedByJoin('p')}`;

/**
 * The active catalog for the admin Products screen, cheapest first.
 * `ownerId` is the viewing sub-admin (shared + own products); `createdBy`
 * narrows it to one sub-admin's products (super-admin's Sub-admins page).
 */
export async function listProducts({ limit = 40, offset = 0, ownerId = null, createdBy }) {
  const where = ['p.is_active', visibleTo('$1')];
  const params = [ownerId];
  if (createdBy !== undefined) {
    params.push(createdBy);
    where.push(`p.created_by IS NOT DISTINCT FROM $${params.length}::uuid`);
  }
  const filter = where.join(' AND ');
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `${SELECT_PRODUCT}
        WHERE ${filter}
        ORDER BY p.price, p.created_at DESC, p.id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT count(*)::int AS total FROM products p WHERE ${filter}`, params),
  ]);
  return { total: countRows[0].total, items: rows.map((row) => toAdminProduct(row, ownerId)) };
}

export async function findAdminProduct(id, ownerId = null) {
  const { rows } = await pool.query(`${SELECT_PRODUCT} WHERE p.id = $1`, [id]);
  return rows[0] ? toAdminProduct(rows[0], ownerId) : null;
}

/** `createdBy` is the sub-admin creating it, or null for a super-admin (shared catalog). */
export async function createProduct({ title, imageUrl, description, price, profitPercentage, createdBy = null }) {
  const { rows } = await pool.query(
    `INSERT INTO products (title, image_url, description, price, profit_percentage, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, imageUrl, description, price, profitPercentage, createdBy]
  );
  return rows[0];
}

const EDITABLE = {
  title: 'title',
  imageUrl: 'image_url',
  description: 'description',
  price: 'price',
  profitPercentage: 'profit_percentage',
};

/** A sub-admin (`ownerId`) may only change their own products; a super-admin (null) any. */
const OWNED = 'AND ($2::uuid IS NULL OR created_by = $2)';

/**
 * Applies only the fields present in `changes`. Open orders keep the price
 * and profit they were assigned with; title and image show through live.
 * Returns the row, or null for an unknown, deleted or not-owned product.
 */
export async function updateProduct(id, changes, { ownerId = null } = {}) {
  const sets = [];
  const params = [id, ownerId];
  for (const [key, column] of Object.entries(EDITABLE)) {
    if (changes[key] === undefined) continue;
    params.push(changes[key]);
    sets.push(`${column} = $${params.length}`);
  }
  if (!sets.length) {
    const { rows } = await pool.query(`SELECT * FROM products WHERE id = $1 AND is_active ${OWNED}`, params);
    return rows[0] ?? null;
  }
  const { rows } = await pool.query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $1 AND is_active ${OWNED} RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

/**
 * Removes a product from the catalog. It's a soft delete: members' existing
 * orders still point at it and carry on as normal.
 */
export async function archiveProduct(id, { ownerId = null } = {}) {
  const { rowCount } = await pool.query(
    `UPDATE products SET is_active = false WHERE id = $1 AND is_active ${OWNED}`,
    [id, ownerId]
  );
  return rowCount > 0;
}
