/**
 * Applies every `migrations/*.sql` file that has not run yet, in filename
 * order, each inside its own transaction. Applied files are recorded in
 * `schema_migrations`, so never edit a migration after it has shipped —
 * add a new numbered file instead.
 */
import { readdir, readFile } from 'node:fs/promises';
import { pool } from './pool.js';

const dir = new URL('../../migrations/', import.meta.url);

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

const { rows } = await pool.query('SELECT name FROM schema_migrations');
const applied = new Set(rows.map((r) => r.name));
const pending = (await readdir(dir))
  .filter((f) => f.endsWith('.sql') && !applied.has(f))
  .sort();

for (const file of pending) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(await readFile(new URL(file, dir), 'utf8'));
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`applied ${file}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`failed ${file}: ${err.message}`);
    process.exitCode = 1;
    break;
  } finally {
    client.release();
  }
}

if (!pending.length) console.log('database is up to date');
await pool.end();
