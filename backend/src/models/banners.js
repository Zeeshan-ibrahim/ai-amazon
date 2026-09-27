import { pool } from '../db/pool.js';

/** Both apps' view — matches `Banner` in frontend/src/lib/types.ts. */
export const toBanner = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  image: row.image_url,
  supportNote: row.support_note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Every banner, newest first. The admin Banners screen and the trader's
 * dashboard read this same query, so both always show the same banners.
 */
export async function listBanners() {
  const { rows } = await pool.query('SELECT * FROM banners ORDER BY created_at DESC, id');
  return rows.map(toBanner);
}

export async function createBanner({ title, description, imageUrl, supportNote }) {
  const { rows } = await pool.query(
    `INSERT INTO banners (title, description, image_url, support_note)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, imageUrl, supportNote]
  );
  return rows[0];
}

const EDITABLE = {
  title: 'title',
  description: 'description',
  imageUrl: 'image_url',
  supportNote: 'support_note',
};

/** Applies only the fields present in `changes`. Returns the row, or null if unknown. */
export async function updateBanner(id, changes) {
  const sets = [];
  const params = [id];
  for (const [key, column] of Object.entries(EDITABLE)) {
    if (changes[key] === undefined) continue;
    params.push(changes[key]);
    sets.push(`${column} = $${params.length}`);
  }
  const { rows } = sets.length
    ? await pool.query(`UPDATE banners SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, params)
    : await pool.query('SELECT * FROM banners WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function deleteBanner(id) {
  const { rowCount } = await pool.query('DELETE FROM banners WHERE id = $1', [id]);
  return rowCount > 0;
}
