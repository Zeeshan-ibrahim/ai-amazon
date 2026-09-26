import { pool } from '../db/pool.js';

export const toWallet = (row) => ({
  id: row.id,
  coin: row.coin,
  network: row.network,
  address: row.address,
});

/** Wallets offered to traders in the Deposit Center. */
export async function listActiveWallets() {
  const { rows } = await pool.query(
    'SELECT * FROM wallets WHERE is_active ORDER BY coin, network, created_at'
  );
  return rows.map(toWallet);
}

export async function findActiveWallet(id) {
  const { rows } = await pool.query('SELECT * FROM wallets WHERE id = $1 AND is_active', [id]);
  return rows[0] ?? null;
}
