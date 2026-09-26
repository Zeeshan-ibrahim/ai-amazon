import jwt from 'jsonwebtoken';
import { findById, toPublicUser } from '../models/users.js';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env.');
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/** The token only carries the user id — role is re-read from the DB on every request. */
export function startSession(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: SESSION_TTL_SECONDS,
  });
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function endSession(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

const deny = (res, status, message) =>
  res.status(status).json({ success: false, message });

/**
 * Resolves the session cookie to a live user row. Sets `req.user` (public
 * shape) and `req.userRow` (full row, for handlers that need hashes).
 */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return deny(res, 401, 'Please sign in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    endSession(res);
    return deny(res, 401, 'Your session has expired. Please sign in again.');
  }

  try {
    const row = await findById(payload.sub);
    if (!row) {
      endSession(res);
      return deny(res, 401, 'Please sign in to continue.');
    }
    if (row.status !== 'active') {
      endSession(res);
      return deny(res, 403, 'This account has been suspended.');
    }
    req.userRow = row;
    req.user = toPublicUser(row);
    next();
  } catch (err) {
    next(err);
  }
}

/** Must run after `requireAuth`. Roles are exclusive: admins cannot use user routes and vice versa. */
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : deny(res, 403, 'You do not have access to this resource.');
