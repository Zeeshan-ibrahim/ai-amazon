import { Router } from 'express';
import { endSession, startSession } from '../middleware/auth.js';
import {
  createUser,
  EMAIL_PATTERN,
  findByEmail,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  toPublicUser,
  touchLastLogin,
  verifySecret,
} from '../models/users.js';
import { fail, ok } from './respond.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, firstName } = req.body ?? {};
  if (!email || !password) {
    return fail(res, 400, 'Email and password are required.');
  }
  if (!EMAIL_PATTERN.test(normalizeEmail(email))) {
    return fail(res, 400, 'Enter a valid email address.');
  }
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return fail(res, 400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  // Role is never read from the request — public signup only creates traders.
  let row;
  try {
    row = await createUser({
      email,
      password: String(password),
      firstName: String(firstName ?? '').trim(),
    });
  } catch (err) {
    if (err.code === '23505') {
      return fail(res, 409, 'An account with this email already exists.');
    }
    throw err;
  }

  startSession(res, row.id);
  ok(res, { user: toPublicUser(row) }, 201);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return fail(res, 400, 'Email and password are required.');
  }

  const row = await findByEmail(email);
  if (!row || !(await verifySecret(String(password), row.password_hash))) {
    return fail(res, 401, 'Invalid email or password.');
  }
  if (row.status !== 'active') {
    return fail(res, 403, 'This account has been suspended.');
  }

  await touchLastLogin(row.id);
  startSession(res, row.id);
  ok(res, { user: toPublicUser(row) });
});

router.post('/logout', (req, res) => {
  endSession(res);
  ok(res, { message: 'Signed out.' });
});

router.post('/forgot-password', (req, res) =>
  ok(res, { message: 'If that account exists, a reset link has been sent.' })
);

export default router;
