import { pool } from '../db/pool.js';

export const toWallet = (row) => ({
  id: row.id,
  coin: row.coin,
  network: row.network,
  address: row.address,
});

/**
 * Active wallets. The admin Wallets screen and the trader's Deposit Center
 * both read this, so traders can only pay into wallets the admin has added.
 */
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

/**
 * Adds a wallet. Re-adding a deleted wallet (same network and address)
 * brings it back. Returns null when that address is already active.
 */
export async function createWallet({ coin, network, address }) {
  const { rows } = await pool.query(
    `INSERT INTO wallets (coin, network, address)
     VALUES ($1, $2, $3)
     ON CONFLICT (network, address)
       DO UPDATE SET coin = EXCLUDED.coin, is_active = true
       WHERE NOT wallets.is_active
     RETURNING *`,
    [coin, network, address]
  );
  return rows[0] ?? null;
}

/**
 * Stops offering a wallet for deposits. Soft delete: past deposits keep
 * their reference and a copy of the address.
 */
export async function archiveWallet(id) {
  const { rowCount } = await pool.query(
    'UPDATE wallets SET is_active = false WHERE id = $1 AND is_active',
    [id]
  );
  return rowCount > 0;
}
