import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

// NUMERIC comes back as a string by default to avoid float precision loss.
// Money columns are NUMERIC(14,2), which a JS number represents exactly.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);

const isLocal = /@?(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL);

// Hosted Postgres (Supabase) needs TLS; its cert chain is not in Node's
// default store, so encrypt without verifying the CA. Serverless instances
// each hold their own pool, so keep it to one connection there and let the
// Supabase transaction pooler (port 6543) do the multiplexing.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: process.env.VERCEL ? 1 : 10,
});

export const query = (text, params) => pool.query(text, params);

/**
 * Runs `fn(client)` inside BEGIN/COMMIT, rolling back if it throws. Use for
 * anything that moves money or must be audited together with its change.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
