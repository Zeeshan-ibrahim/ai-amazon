/**
 * Access layers, in order:
 *
 *   /auth/*     public
 *   /me, ...    any signed-in role (account.js)
 *   /admin/*    role = super_admin or sub_admin (admin.js)
 *   everything  role = user  (user.js)
 */
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ADMIN_ROLES, ROLES } from '../models/users.js';
import account from './account.js';
import admin from './admin.js';
import auth from './auth.js';
import { fail } from './respond.js';
import user from './user.js';

const router = Router();

router.use('/auth', auth);

router.use(requireAuth);
router.use(account);
router.use('/admin', requireRole(...ADMIN_ROLES), admin, (req, res) =>
  fail(res, 404, "We couldn't find what you were looking for.")
);
router.use(requireRole(ROLES.USER), user);

export default router;
