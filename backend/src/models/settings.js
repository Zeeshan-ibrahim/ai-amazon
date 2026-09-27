import { pool } from '../db/pool.js';

/** Matches `Settings` in frontend/src/lib/types.ts. */
const toSettings = (row) => ({
  telegramSupportUrl: row.telegram_support_url,
  globalWithdrawalLimit: row.global_withdrawal_limit,
  updatedAt: row.updated_at,
});

export async function getSettings() {
  const { rows } = await pool.query('SELECT * FROM settings');
  return toSettings(rows[0]);
}

/** Saves both fields; `telegramSupportUrl` may be null to clear it. */
export async function saveSettings({ telegramSupportUrl, globalWithdrawalLimit }) {
  const { rows } = await pool.query(
    `UPDATE settings SET telegram_support_url = $1, global_withdrawal_limit = $2 RETURNING *`,
    [telegramSupportUrl, globalWithdrawalLimit]
  );
  return toSettings(rows[0]);
}
