/**
 * The signed-in person's own account. Shared by every role — the admin
 * panel's "My Acc" screen uses these too.
 */
import { Router } from 'express';
import * as db from '../data/demo.js';
import {
  MIN_PASSWORD_LENGTH,
  toPublicUser,
  updatePassword,
  updateProfile,
  updateWithdrawalPin,
  verifySecret,
} from '../models/users.js';
import { fail, ok } from './respond.js';

const router = Router();

router.get('/me', (req, res) => ok(res, req.user));

router.patch('/me', async (req, res) => {
  try {
    ok(res, toPublicUser(await updateProfile(req.user.id, req.body ?? {})));
  } catch (err) {
    if (err.code === '23505') return fail(res, 409, 'That username is already taken.');
    throw err;
  }
});

const PIN_PATTERN = /^\d{4,6}$/;

/**
 * `scope: 'login'` (default) changes the sign-in password.
 * `scope: 'pin'` changes the withdrawal PIN. The first PIN is authorized by
 * the login password, since there is no current PIN to check yet.
 */
router.put('/me/password', async (req, res) => {
  const { currentPassword, newPassword, confirmPassword, scope = 'login' } = req.body ?? {};
  const isPin = scope === 'pin';
  const noun = isPin ? 'PIN' : 'Password';

  if (scope !== 'login' && !isPin) return fail(res, 400, 'Unknown scope.');
  if (!currentPassword || !newPassword) {
    return fail(res, 400, `All ${noun.toLowerCase()} fields are required.`);
  }
  if (newPassword !== confirmPassword) return fail(res, 400, `${noun}s do not match.`);

  const next = String(newPassword);
  if (isPin && !PIN_PATTERN.test(next)) {
    return fail(res, 400, 'PIN must be 4 to 6 digits.');
  }
  if (!isPin && next.length < MIN_PASSWORD_LENGTH) {
    return fail(res, 400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const row = req.userRow;
  const checkAgainst = isPin && row.withdrawal_pin_hash ? row.withdrawal_pin_hash : row.password_hash;
  if (!(await verifySecret(String(currentPassword), checkAgainst))) {
    return fail(res, 400, isPin && row.withdrawal_pin_hash ? 'Current PIN is incorrect.' : 'Current password is incorrect.');
  }

  await (isPin ? updateWithdrawalPin : updatePassword)(row.id, next);
  ok(res, { message: `${noun} updated.` });
});

router.put('/me/language', async (req, res) => {
  const { language } = req.body ?? {};
  if (!db.languages.some((l) => l.code === language)) {
    return fail(res, 400, 'Unsupported language.');
  }
  const row = await updateProfile(req.user.id, { language });
  ok(res, { language: row.language });
});

router.get('/languages', (req, res) => ok(res, db.languages));

export default router;
