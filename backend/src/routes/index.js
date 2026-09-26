/**
 * Access layers, in order:
 *
 *   /auth/*     public
 *   /me, ...    any signed-in role (account.js)
 *   /admin/*    role = admin (admin.js)
 *   everything  role = user  (user.js)
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../models/users.js';
import account from './account.js';
import admin from './admin.js';
import auth from './auth.js';
import { fail } from './respond.js';
import user from './user.js';

const router = Router();

router.use('/auth', auth);

router.use(requireAuth);
router.use(account);
router.use('/admin', requireRole(ROLES.ADMIN), admin, (req, res) =>
  fail(res, 404, 'Route not found.')
);
router.use(requireRole(ROLES.USER), user);

export default router;
