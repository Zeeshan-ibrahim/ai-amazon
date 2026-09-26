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
