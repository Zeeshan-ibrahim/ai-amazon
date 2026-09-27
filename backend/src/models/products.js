import { pool } from '../db/pool.js';

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
 */
export async function listCatalog({ forUserId, q, min, max, limit = 30, offset = 0 }) {
  // Filter params come first so the count query can reuse them as-is.
  const where = ['p.is_active'];
  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

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

export const toAdminProduct = (row) => ({
  id: row.id,
  title: row.title,
  image: row.image_url,
  description: row.description,
  price: row.price,
  profitPercentage: row.profit_percentage,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** The active catalog for the admin Products screen, cheapest first. */
export async function listProducts({ limit = 40, offset = 0 }) {
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT * FROM products
        WHERE is_active
        ORDER BY price, created_at DESC, id
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query('SELECT count(*)::int AS total FROM products WHERE is_active'),
  ]);
  return { total: countRows[0].total, items: rows.map(toAdminProduct) };
}

export async function createProduct({ title, imageUrl, description, price, profitPercentage }) {
  const { rows } = await pool.query(
    `INSERT INTO products (title, image_url, description, price, profit_percentage)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, imageUrl, description, price, profitPercentage]
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

/**
 * Applies only the fields present in `changes`. Open orders keep the price
 * and profit they were assigned with; title and image show through live.
 * Returns the row, or null for an unknown or deleted product.
 */
export async function updateProduct(id, changes) {
  const sets = [];
  const params = [id];
  for (const [key, column] of Object.entries(EDITABLE)) {
    if (changes[key] === undefined) continue;
    params.push(changes[key]);
    sets.push(`${column} = $${params.length}`);
  }
  if (!sets.length) {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1 AND is_active', [id]);
    return rows[0] ?? null;
  }
  const { rows } = await pool.query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $1 AND is_active RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

/**
 * Removes a product from the catalog. It's a soft delete: members' existing
 * orders still point at it and carry on as normal.
 */
export async function archiveProduct(id) {
  const { rowCount } = await pool.query(
    'UPDATE products SET is_active = false WHERE id = $1 AND is_active',
    [id]
  );
  return rowCount > 0;
}
