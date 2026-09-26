/**
 * The only way to create an admin — signup can't.
 *
 *   npm run db:create-admin -- --email ops@example.com --password '...' [--username admin]
 */
import { parseArgs } from 'node:util';
import { pool } from './pool.js';
import { createUser, ROLES } from '../models/users.js';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    password: { type: 'string' },
    username: { type: 'string' },
  },
});

if (!values.email || !values.password) {
  console.error('usage: npm run db:create-admin -- --email <email> --password <password> [--username <name>]');
  process.exit(1);
}
if (values.password.length < 8) {
  console.error('password must be at least 8 characters');
  process.exit(1);
}

try {
  const row = await createUser({ ...values, role: ROLES.ADMIN });
  console.log(`created admin ${row.email} (${row.id})`);
} catch (err) {
  console.error(err.code === '23505' ? 'a user with that email or username already exists' : err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
