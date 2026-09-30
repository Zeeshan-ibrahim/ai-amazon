/**
 * Applies every `migrations/*.sql` file that has not run yet, in filename
 * order, each inside its own transaction. Applied files are recorded in
 * `schema_migrations`, so never edit a migration after it has shipped —
 * add a new numbered file instead.
 *
 * Also runs as the backend's Vercel build step (see vercel.json), so a
 * production deploy migrates before its code goes live and a failed
 * migration fails the deploy. Preview builds skip it: they share the
 * production env vars and must not apply unreviewed branch migrations.
 */
import { readdir, readFile } from 'node:fs/promises';

if (process.env.VERCEL && process.env.VERCEL_ENV !== 'production') {
  console.log(`skipping migrations on a ${process.env.VERCEL_ENV} build`);
  process.exit(0);
}

const { pool } = await import('./pool.js');

const dir = new URL('../../migrations/', import.meta.url);

// Serializes concurrent runs (two deploys building at once). A transaction-
// scoped lock, because the Supabase transaction pooler does not keep a
// session-level lock on the same connection between transactions.
const LOCK_ID = 7201991;

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const client = await pool.connect();
let appliedCount = 0;

try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await client.query('COMMIT');

  for (const file of files) {
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID]);
      // Checked under the lock, so a run that waited sees what the other applied.
      const { rowCount } = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (rowCount) {
        await client.query('COMMIT');
        continue;
      }
      await client.query(await readFile(new URL(file, dir), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      appliedCount++;
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`failed ${file}: ${err.message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  client.release();
}

if (!appliedCount && !process.exitCode) console.log('database is up to date');
await pool.end();
