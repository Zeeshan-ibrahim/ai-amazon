/**
 * Admin panel API. Mounted at `/api/admin` behind
 * `requireRole('super_admin', 'sub_admin')`, so every handler here can
 * assume an admin session.
 *
 * Roles (docs/roles.md): a super-admin sees everything. A sub-admin sees
 * only the traders, plans and products they created (plus the shared
 * catalog) — every query takes `ownerIdOf(req)`, and anything outside that
 * 404s. Banners, wallets, settings and the Sub-admins page are
 * super-admin only; My Balance is sub-admin only.
 *
 * Built: members (list, create, particulars, ledger, orders, audits),
 * financials (the deposit/withdrawal review queue), the product catalog,
 * plans, plan requests, banners, wallets & support settings, and the group
 * overview (My Acc). Still to come: analytics.
 */
import { Router } from 'express';
import { pool, withTransaction } from '../db/pool.js';
import { requireRole } from '../middleware/auth.js';
import { AUDIT, listAuditsForUser, recordAudit } from '../models/audit.js';
import {
  findActiveSubAdmin,
  getMemberRow,
  listMembers,
  releaseOwned,
  toMember,
  updateMember,
} from '../models/members.js';
import { deleteSubAdmin, getSubAdmin, listSubAdmins } from '../models/subAdmins.js';
import {
  assignOrder,
  listOrdersForUser,
  ORDER_STATUSES,
  removeOrderByAdmin,
  toAdminOrder,
  updateOrderByAdmin,
} from '../models/orders.js';
import { createBanner, deleteBanner, listBanners, toBanner, updateBanner } from '../models/banners.js';
import {
  archivePlan,
  createPlan,
  findAdminPlan,
  listAdminPlans,
  listPlanRequests,
  reviewPlanRequest,
  updatePlan,
} from '../models/plans.js';
import {
  archiveProduct,
  createProduct,
  findAdminProduct,
  listCatalog,
  listProducts,
  updateProduct,
} from '../models/products.js';
import {
  adjustBalance,
  createRequest,
  findTransaction,
  LedgerError,
  listRequests,
  listTransactions,
  reviewTransaction,
  toLedgerEntry,
  toTransaction,
} from '../models/transactions.js';
import { getDiagnostics, getOverview } from '../models/overview.js';
import { getSettings, saveSettings } from '../models/settings.js';
import { archiveWallet, createWallet, listActiveWallets, toWallet } from '../models/wallets.js';
import { readReceipt } from '../uploads.js';
import { parseReceipt, receiveDeposit } from './deposits.js';
import {
  createUser,
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  ROLES,
  UUID_PATTERN,
} from '../models/users.js';
import { fail, ok } from './respond.js';

const router = Router();

const ROLE_VALUES = Object.values(ROLES);

// Withdrawals go out as USDT on TRON, as for traders.
const WITHDRAWAL_COIN = 'USDT';
const WITHDRAWAL_NETWORK = 'TRC20';
const STATUS_VALUES = ['active', 'suspended'];

/** The sub-admin whose records a request is limited to, or null for a super-admin (everything). */
const ownerIdOf = (req) => (req.user.role === ROLES.SUB_ADMIN ? req.user.id : null);

const isSuperAdmin = (req) => req.user.role === ROLES.SUPER_ADMIN;

// Group-wide configuration and sub-admin management are super-admin only.
router.use(['/banners', '/wallets', '/settings', '/sub-admins'], requireRole(ROLES.SUPER_ADMIN));
// A sub-admin's own balance; a super-admin's balance isn't used.
router.use('/balance', requireRole(ROLES.SUB_ADMIN));

/** `?limit=&offset=` with sane bounds. */
const page = (query, defaultLimit) => ({
  limit: Math.min(Math.max(Number(query.limit) || defaultLimit, 1), 100),
  offset: Math.max(Number(query.offset) || 0, 0),
});

const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

/**
 * Validates member fields shared by create and update. Returns
 * `{ error }` or `{ changes }` with only the fields that were sent.
 * `role`, `status` and `ownerId` are super-admin only (`canManage`).
 */
function readMemberInput(body, { creating, canManage }) {
  const changes = {};
  const {
    firstName, lastName, username, phone, email, role, status, ownerId, withdrawalLimit, password,
  } = body ?? {};

  if (!canManage && (role !== undefined || status !== undefined || ownerId !== undefined)) {
    return { error: 'Only a super-admin can change roles, status or owners.' };
  }

  for (const [key, value] of Object.entries({ firstName, lastName, username, phone })) {
    if (value !== undefined) changes[key] = String(value).trim();
  }
  if (email !== undefined || creating) {
    if (!EMAIL_PATTERN.test(normalizeEmail(email))) return { error: 'Enter a valid email address.' };
    changes.email = normalizeEmail(email);
  }
  if (role !== undefined) {
    if (!ROLE_VALUES.includes(role)) return { error: 'Unknown role.' };
    changes.role = role;
  }
  if (status !== undefined) {
    if (!STATUS_VALUES.includes(status)) return { error: 'Unknown status.' };
    changes.status = status;
  }
  if (ownerId !== undefined) {
    if (ownerId !== null && !UUID_PATTERN.test(String(ownerId))) return { error: 'Choose a sub-admin.' };
    changes.ownerId = ownerId;
  }
  if (withdrawalLimit !== undefined) {
    const limit = money(withdrawalLimit);
    if (!(limit >= 0)) return { error: 'Withdrawal limit must be 0 or more.' };
    changes.withdrawalLimit = limit;
  }
  if (password || creating) {
    if (String(password ?? '').length < MIN_PASSWORD_LENGTH) {
      return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }
    changes.password = String(password);
  }
  return { changes };
}

const uniqueViolation = (err) =>
  err.code === '23505'
    ? err.constraint === 'users_username_key'
      ? 'That username is already taken.'
      : 'An account with this email already exists.'
    : null;

/**
 * Checks `changes.ownerId` against the account's resulting role: only
 * traders have an owner, and it must be an active sub-admin. Any other role
 * is always owned by the super-admin (null). Returns an error message or null.
 */
async function checkOwner(db, changes, { role, memberId }) {
  if (role !== ROLES.USER) {
    if (changes.ownerId) return 'Only user accounts can be assigned to a sub-admin.';
    changes.ownerId = null;
    return null;
  }
  if (!changes.ownerId) return null;
  if (changes.ownerId === memberId || !(await findActiveSubAdmin(changes.ownerId, db))) {
    return 'Choose an active sub-admin.';
  }
  return null;
}

/* ------------------------------------------------------------- members */

/** `?q=&addedBy=<sub-admin id>|super` — `addedBy` is the super-admin's filter. */
router.get('/members', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const { addedBy } = req.query;
  let createdBy;
  if (isSuperAdmin(req) && addedBy) {
    if (addedBy === 'super') createdBy = null;
    else if (UUID_PATTERN.test(String(addedBy))) createdBy = addedBy;
    else return fail(res, 400, 'Unknown filter.');
  }
  ok(res, await listMembers({ q, ownerId: ownerIdOf(req), createdBy, ...page(req.query, 50) }));
});

/** A sub-admin can only create traders, and owns them. */
async function createMember(req, res, { forceRole } = {}) {
  const canManage = isSuperAdmin(req);
  const { error, changes } = readMemberInput(req.body, { creating: true, canManage });
  if (error) return fail(res, 400, error);
  const role = forceRole ?? (canManage ? changes.role ?? ROLES.USER : ROLES.USER);

  try {
    const member = await withTransaction(async (db) => {
      const ownerError = canManage && (await checkOwner(db, changes, { role }));
      if (ownerError) throw new LedgerError(400, ownerError);

      const row = await createUser(
        {
          ...changes,
          username: changes.username?.trim().replace(/^@/, '') || null,
          role,
          createdBy: canManage ? changes.ownerId ?? null : req.user.id,
        },
        db
      );
      if (changes.withdrawalLimit) {
        await db.query('UPDATE users SET withdrawal_limit = $2 WHERE id = $1', [
          row.id,
          changes.withdrawalLimit,
        ]);
      }
      await recordAudit(db, {
        actorId: req.user.id,
        targetUserId: row.id,
        action: AUDIT.MEMBER_CREATED,
        details: { email: row.email, role: row.role, ...(row.created_by && { ownerId: row.created_by }) },
      });
      return getMemberRow(row.id, db);
    });
    ok(res, toMember(member), 201);
  } catch (err) {
    const message = uniqueViolation(err);
    if (message) return fail(res, 409, message);
    throw err;
  }
}

router.post('/members', (req, res) => createMember(req, res));

// Every /members/:id route 404s on a malformed or unknown id — or, for a
// sub-admin, one that isn't theirs — and gets `req.member`.
router.param('id', async (req, res, next, id) => {
  const row = UUID_PATTERN.test(id) ? await getMemberRow(id, pool, { ownerId: ownerIdOf(req) }) : null;
  if (!row) return fail(res, 404, 'Member not found.');
  req.member = row;
  next();
});

router.get('/members/:id', (req, res) => ok(res, toMember(req.member)));

/**
 * Super-admins may also change `role`, `status` and `ownerId` (docs/roles.md,
 * "Moving records"). A sub-admin who stops being one hands their traders,
 * plans and products back to the super-admin in the same transaction.
 */
router.patch('/members/:id', async (req, res) => {
  const { error, changes } = readMemberInput(req.body, { creating: false, canManage: isSuperAdmin(req) });
  if (error) return fail(res, 400, error);

  const isSelf = req.member.id === req.user.id;
  if (isSelf && changes.role && changes.role !== req.member.role) {
    return fail(res, 400, "You can't change your own role.");
  }
  if (isSelf && changes.status && changes.status !== req.member.status) {
    return fail(res, 400, "You can't change your own status.");
  }

  const role = changes.role ?? req.member.role;
  // Leaving the trader role (or sending an owner) settles the owner too.
  if (role !== ROLES.USER || changes.ownerId !== undefined) {
    const ownerError = await checkOwner(pool, changes, { role, memberId: req.member.id });
    if (ownerError) return fail(res, 400, ownerError);
  }

  try {
    const { row, diff } = await withTransaction(async (db) => {
      if (req.member.role === ROLES.SUB_ADMIN && role !== ROLES.SUB_ADMIN) {
        const handedBack = await releaseOwned(db, req.member.id);
        await recordAudit(db, {
          actorId: req.user.id,
          targetUserId: req.member.id,
          action: AUDIT.SUB_ADMIN_RELEASED,
          details: { handedBack, newRole: role },
        });
      }
      const result = await updateMember(db, req.member.id, req.member, changes);
      if (Object.keys(result.diff).length) {
        await recordAudit(db, {
          actorId: req.user.id,
          targetUserId: req.member.id,
          action: AUDIT.MEMBER_UPDATED,
          details: { changes: result.diff },
        });
      }
      return result;
    });
    ok(res, { member: toMember(row), changed: Object.keys(diff) });
  } catch (err) {
    const message = uniqueViolation(err);
    if (message) return fail(res, 409, message);
    throw err;
  }
});

/* -------------------------------------------------------------- ledger */

router.get('/members/:id/transactions', async (req, res) => {
  ok(res, (await listTransactions(req.member.id)).map(toLedgerEntry));
});

router.post('/members/:id/adjustments', async (req, res) => {
  const { direction, amount, note } = req.body ?? {};
  const value = money(amount);
  if (direction !== 'credit' && direction !== 'debit') {
    return fail(res, 400, 'Choose credit or debit.');
  }
  if (!(value > 0)) return fail(res, 400, 'Enter an amount greater than 0.');

  const tx = await adjustBalance({
    userId: req.member.id,
    adminId: req.user.id,
    direction,
    amount: value,
    note: String(note ?? '').trim(),
  });
  ok(res, toLedgerEntry(tx), 201);
});

const review = (approve) => async (req, res) => {
  if (!UUID_PATTERN.test(req.params.transactionId)) {
    return fail(res, 404, 'Transaction not found.');
  }
  const tx = await reviewTransaction({
    transactionId: req.params.transactionId,
    adminId: req.user.id,
    approve,
    note: String(req.body?.note ?? '').trim(),
    ownerId: ownerIdOf(req),
  });
  ok(res, toLedgerEntry(tx));
};

router.post('/transactions/:transactionId/approve', review(true));
router.post('/transactions/:transactionId/reject', review(false));

/* ---------------------------------------------------------- financials */

/** `?type=deposit|withdrawal&scope=active|history&limit=&offset=` */
router.get('/transactions', async (req, res) => {
  const { type = 'deposit', scope = 'active' } = req.query;
  if (type !== 'deposit' && type !== 'withdrawal') return fail(res, 400, 'Unknown type.');
  if (scope !== 'active' && scope !== 'history') return fail(res, 400, 'Unknown scope.');
  ok(res, await listRequests({ type, scope, ownerId: ownerIdOf(req), ...page(req.query, 20) }));
});

/** The uploaded receipt image, served inline to admins only. */
router.get('/transactions/:transactionId/receipt', async (req, res) => {
  const tx = UUID_PATTERN.test(req.params.transactionId)
    ? await findTransaction(req.params.transactionId, { ownerId: ownerIdOf(req) })
    : null;
  if (!tx?.receipt_path) return fail(res, 404, 'Receipt not found.');

  const file = await readReceipt(tx.receipt_path);
  if (!file) return fail(res, 404, 'Receipt not found.');

  res
    .set({
      'Content-Type': file.mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      // The admin app runs on another origin and embeds this with <img>.
      'Cross-Origin-Resource-Policy': 'same-site',
    })
    .send(file.buffer);
});

/* -------------------------------------------------------------- orders */

router.get('/members/:id/catalog', async (req, res) => {
  const bound = (v) => (v === undefined || v === '' ? undefined : money(v));
  const min = bound(req.query.min);
  const max = bound(req.query.max);
  if (Number.isNaN(min) || Number.isNaN(max)) return fail(res, 400, 'Invalid price range.');

  ok(
    res,
    await listCatalog({
      forUserId: req.member.id,
      q: String(req.query.q ?? '').trim(),
      min,
      max,
      ownerId: ownerIdOf(req),
      ...page(req.query, 30),
    })
  );
});

router.post('/members/:id/orders', async (req, res) => {
  if (req.member.role !== ROLES.USER) {
    return fail(res, 400, 'Orders can only be assigned to user accounts.');
  }
  const { productId } = req.body ?? {};
  if (!UUID_PATTERN.test(String(productId))) return fail(res, 404, 'Product not found.');

  try {
    const order = await withTransaction((db) =>
      assignOrder(db, { userId: req.member.id, productId, adminId: req.user.id, ownerId: ownerIdOf(req) })
    );
    if (!order) return fail(res, 404, 'Product not found.');
    ok(res, { id: order.id, productId, status: order.status }, 201);
  } catch (err) {
    if (err.code === '23505') return fail(res, 409, 'Already assigned to this member.');
    throw err;
  }
});

router.get('/members/:id/orders', async (req, res) => {
  ok(res, (await listOrdersForUser(req.member.id, { newestFirst: true })).map(toAdminOrder));
});

// Column limits: price NUMERIC(14,2) > 0, profit NUMERIC(6,3) >= 0.
const MAX_PRICE = 999_999_999_999.99;
const MAX_PROFIT_PERCENTAGE = 999.999;

/** `{ price?, profitPercentage?, status? }` from the Custom Edit panel. */
function readOrderEdit(body) {
  const { price, profitPercentage, status } = body ?? {};
  const edit = {};
  if (price !== undefined) {
    edit.price = money(price);
    if (!(edit.price > 0 && edit.price <= MAX_PRICE)) return { error: 'Enter a price greater than $0.' };
  }
  if (profitPercentage !== undefined) {
    const n = Number(profitPercentage);
    edit.profitPercentage = Number.isFinite(n) ? Math.round(n * 1000) / 1000 : NaN;
    if (!(edit.profitPercentage >= 0 && edit.profitPercentage <= MAX_PROFIT_PERCENTAGE)) {
      return { error: 'Enter a profit percentage between 0 and 999.999.' };
    }
  }
  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) return { error: 'Unknown order status.' };
    edit.status = status;
  }
  return { edit };
}

router.patch('/members/:id/orders/:orderId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.orderId)) return fail(res, 404, 'Order not found.');
  const { error, edit } = readOrderEdit(req.body);
  if (error) return fail(res, 400, error);

  const order = await updateOrderByAdmin({
    orderId: req.params.orderId,
    userId: req.member.id,
    adminId: req.user.id,
    ...edit,
  });
  ok(res, toAdminOrder(order));
});

router.delete('/members/:id/orders/:orderId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.orderId)) return fail(res, 404, 'Order not found.');
  await removeOrderByAdmin({ orderId: req.params.orderId, userId: req.member.id, adminId: req.user.id });
  ok(res, { id: req.params.orderId });
});

/* ------------------------------------------------------------ products */

const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Validates the Add/Edit Product form. Returns `{ error }` or `{ changes }`
 * with only the fields that were sent; creating requires title and price.
 */
function readProductInput(body, { creating }) {
  const { title, imageUrl, description, price, profitPercentage } = body ?? {};
  const changes = {};

  if (title !== undefined || creating) {
    changes.title = String(title ?? '').trim();
    if (!changes.title) return { error: 'Enter a product title.' };
    if (changes.title.length > MAX_TITLE_LENGTH) {
      return { error: `Keep the title under ${MAX_TITLE_LENGTH} characters.` };
    }
  }
  if (price !== undefined || creating) {
    changes.price = money(price);
    if (!(changes.price > 0 && changes.price <= MAX_PRICE)) {
      return { error: 'Enter an entry price greater than $0.' };
    }
  }
  if (profitPercentage !== undefined || creating) {
    const n = Number(profitPercentage ?? 0);
    changes.profitPercentage = Number.isFinite(n) ? Math.round(n * 1000) / 1000 : NaN;
    if (!(changes.profitPercentage >= 0 && changes.profitPercentage <= MAX_PROFIT_PERCENTAGE)) {
      return { error: 'Enter a return % between 0 and 999.999.' };
    }
  }
  if (imageUrl !== undefined || creating) {
    const url = String(imageUrl ?? '').trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      return { error: 'Image URL must start with http:// or https://.' };
    }
    changes.imageUrl = url || null;
  }
  if (description !== undefined || creating) {
    changes.description = String(description ?? '').trim();
    if (changes.description.length > MAX_DESCRIPTION_LENGTH) {
      return { error: `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.` };
    }
  }
  return { changes };
}

/** A sub-admin sees the shared catalog (read-only) plus their own products. */
router.get('/products', async (req, res) => {
  ok(res, await listProducts({ ownerId: ownerIdOf(req), ...page(req.query, 40) }));
});

/** A super-admin's products join the shared catalog; a sub-admin's are theirs only. */
router.post('/products', async (req, res) => {
  const { error, changes } = readProductInput(req.body, { creating: true });
  if (error) return fail(res, 400, error);
  const row = await createProduct({ ...changes, createdBy: ownerIdOf(req) });
  ok(res, await findAdminProduct(row.id, ownerIdOf(req)), 201);
});

router.patch('/products/:productId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.productId)) return fail(res, 404, 'Product not found.');
  const { error, changes } = readProductInput(req.body, { creating: false });
  if (error) return fail(res, 400, error);

  const row = await updateProduct(req.params.productId, changes, { ownerId: ownerIdOf(req) });
  if (!row) return fail(res, 404, 'Product not found.');
  ok(res, await findAdminProduct(row.id, ownerIdOf(req)));
});

router.delete('/products/:productId', async (req, res) => {
  const found =
    UUID_PATTERN.test(req.params.productId) &&
    (await archiveProduct(req.params.productId, { ownerId: ownerIdOf(req) }));
  if (!found) return fail(res, 404, 'Product not found.');
  ok(res, { id: req.params.productId });
});

/* --------------------------------------------------------------- plans */

const MAX_PLAN_NAME_LENGTH = 120;
const MAX_PLAN_TAG_LENGTH = 40;

/**
 * Validates the Add/Edit Plan form. Returns `{ error }` or `{ changes }`
 * with only the fields that were sent; creating requires name and price.
 */
function readPlanInput(body, { creating }) {
  const { name, tag, description, price, imageUrl } = body ?? {};
  const changes = {};

  if (name !== undefined || creating) {
    changes.name = String(name ?? '').trim();
    if (!changes.name) return { error: 'Enter a plan name.' };
    if (changes.name.length > MAX_PLAN_NAME_LENGTH) {
      return { error: `Keep the plan name under ${MAX_PLAN_NAME_LENGTH} characters.` };
    }
  }
  if (tag !== undefined || creating) {
    changes.tag = String(tag ?? '').trim();
    if (changes.tag.length > MAX_PLAN_TAG_LENGTH) {
      return { error: `Keep the plan tag under ${MAX_PLAN_TAG_LENGTH} characters.` };
    }
  }
  if (price !== undefined || creating) {
    changes.price = money(price);
    if (!(changes.price > 0 && changes.price <= MAX_PRICE)) {
      return { error: 'Enter a price greater than 0 USDT.' };
    }
  }
  if (imageUrl !== undefined || creating) {
    const url = String(imageUrl ?? '').trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      return { error: 'Image URL must start with http:// or https://.' };
    }
    changes.imageUrl = url || null;
  }
  if (description !== undefined || creating) {
    changes.description = String(description ?? '').trim();
    if (changes.description.length > MAX_DESCRIPTION_LENGTH) {
      return { error: `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.` };
    }
  }
  return { changes };
}

/**
 * A super-admin sees every plan; a sub-admin only their own — the only
 * plans their traders see.
 */
router.get('/plans', async (req, res) => {
  const ownerId = ownerIdOf(req);
  ok(res, await listAdminPlans(ownerId ? { createdBy: ownerId } : {}));
});

/** A super-admin's plans are shown to the traders they own; a sub-admin's to theirs. */
router.post('/plans', async (req, res) => {
  const { error, changes } = readPlanInput(req.body, { creating: true });
  if (error) return fail(res, 400, error);
  const row = await createPlan({ ...changes, createdBy: ownerIdOf(req) });
  ok(res, await findAdminPlan(row.id), 201);
});

router.patch('/plans/:planId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.planId)) return fail(res, 404, 'Plan not found.');
  const { error, changes } = readPlanInput(req.body, { creating: false });
  if (error) return fail(res, 400, error);

  const row = await updatePlan(req.params.planId, changes, { ownerId: ownerIdOf(req) });
  if (!row) return fail(res, 404, 'Plan not found.');
  ok(res, await findAdminPlan(row.id));
});

router.delete('/plans/:planId', async (req, res) => {
  const found =
    UUID_PATTERN.test(req.params.planId) &&
    (await archivePlan(req.params.planId, { ownerId: ownerIdOf(req) }));
  if (!found) return fail(res, 404, 'Plan not found.');
  ok(res, { id: req.params.planId });
});

/* ------------------------------------------------------- plan requests */

/** `?scope=active|history&limit=&offset=` */
router.get('/plan-requests', async (req, res) => {
  const { scope = 'active' } = req.query;
  if (scope !== 'active' && scope !== 'history') return fail(res, 400, 'Unknown scope.');
  ok(res, await listPlanRequests({ scope, ownerId: ownerIdOf(req), ...page(req.query, 20) }));
});

const reviewPlan = (approve) => async (req, res) => {
  if (!UUID_PATTERN.test(req.params.contractId)) return fail(res, 404, 'Plan request not found.');
  ok(
    res,
    await reviewPlanRequest({
      contractId: req.params.contractId,
      adminId: req.user.id,
      approve,
      ownerId: ownerIdOf(req),
    })
  );
};

router.post('/plan-requests/:contractId/approve', reviewPlan(true));
router.post('/plan-requests/:contractId/reject', reviewPlan(false));

/* ------------------------------------------------------------- banners */

const MAX_BANNER_TITLE_LENGTH = 120;
const MAX_SUPPORT_NOTE_LENGTH = 500;

/**
 * Validates the Add/Edit Banner form. Returns `{ error }` or `{ changes }`
 * with only the fields that were sent; creating requires a title.
 */
function readBannerInput(body, { creating }) {
  const { title, description, imageUrl, supportNote } = body ?? {};
  const changes = {};

  if (title !== undefined || creating) {
    changes.title = String(title ?? '').trim();
    if (!changes.title) return { error: 'Enter a banner title.' };
    if (changes.title.length > MAX_BANNER_TITLE_LENGTH) {
      return { error: `Keep the title under ${MAX_BANNER_TITLE_LENGTH} characters.` };
    }
  }
  if (imageUrl !== undefined || creating) {
    const url = String(imageUrl ?? '').trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      return { error: 'Image URL must start with http:// or https://.' };
    }
    changes.imageUrl = url || null;
  }
  if (description !== undefined || creating) {
    changes.description = String(description ?? '').trim();
    if (changes.description.length > MAX_DESCRIPTION_LENGTH) {
      return { error: `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.` };
    }
  }
  if (supportNote !== undefined || creating) {
    changes.supportNote = String(supportNote ?? '').trim();
    if (changes.supportNote.length > MAX_SUPPORT_NOTE_LENGTH) {
      return { error: `Keep the support note under ${MAX_SUPPORT_NOTE_LENGTH} characters.` };
    }
  }
  return { changes };
}

router.get('/banners', async (req, res) => ok(res, await listBanners()));

router.post('/banners', async (req, res) => {
  const { error, changes } = readBannerInput(req.body, { creating: true });
  if (error) return fail(res, 400, error);
  ok(res, toBanner(await createBanner(changes)), 201);
});

router.patch('/banners/:bannerId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.bannerId)) return fail(res, 404, 'Banner not found.');
  const { error, changes } = readBannerInput(req.body, { creating: false });
  if (error) return fail(res, 400, error);

  const row = await updateBanner(req.params.bannerId, changes);
  if (!row) return fail(res, 404, 'Banner not found.');
  ok(res, toBanner(row));
});

router.delete('/banners/:bannerId', async (req, res) => {
  const found = UUID_PATTERN.test(req.params.bannerId) && (await deleteBanner(req.params.bannerId));
  if (!found) return fail(res, 404, 'Banner not found.');
  ok(res, { id: req.params.bannerId });
});

/* ----------------------------------------------------- wallets & support */

const MAX_COIN_LENGTH = 20;
const MAX_NETWORK_LENGTH = 30;
const MAX_ADDRESS_LENGTH = 200;

router.get('/wallets', async (req, res) => ok(res, await listActiveWallets()));

/** `{ coin, network, address }` — coin and network are stored uppercase. */
router.post('/wallets', async (req, res) => {
  const coin = String(req.body?.coin ?? '').trim().toUpperCase();
  const network = String(req.body?.network ?? '').trim().toUpperCase();
  const address = String(req.body?.address ?? '').trim();

  if (!coin || coin.length > MAX_COIN_LENGTH) return fail(res, 400, 'Enter a coin, e.g. USDT.');
  if (!network || network.length > MAX_NETWORK_LENGTH) return fail(res, 400, 'Enter a network, e.g. TRC20.');
  if (!address || /\s/.test(address) || address.length > MAX_ADDRESS_LENGTH) {
    return fail(res, 400, 'Enter the wallet address without spaces.');
  }

  const row = await createWallet({ coin, network, address });
  if (!row) return fail(res, 409, 'This address is already listed for that network.');
  ok(res, toWallet(row), 201);
});

router.delete('/wallets/:walletId', async (req, res) => {
  const found = UUID_PATTERN.test(req.params.walletId) && (await archiveWallet(req.params.walletId));
  if (!found) return fail(res, 404, 'Wallet not found.');
  ok(res, { id: req.params.walletId });
});

router.get('/settings', async (req, res) => ok(res, await getSettings()));

/** `{ telegramSupportUrl, globalWithdrawalLimit }` — both saved together. */
router.put('/settings', async (req, res) => {
  const url = String(req.body?.telegramSupportUrl ?? '').trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) {
    return fail(res, 400, 'Support link must start with https://, e.g. https://t.me/your_support.');
  }
  const limit = money(req.body?.globalWithdrawalLimit ?? 0);
  if (!(limit >= 0 && limit <= MAX_PRICE)) return fail(res, 400, 'Withdrawal limit must be 0 or more.');

  ok(res, await saveSettings({ telegramSupportUrl: url || null, globalWithdrawalLimit: limit }));
});

/* ------------------------------------------------------------ overview */

/** Group totals (a sub-admin's cover only their traders) plus live system checks. */
router.get('/overview', async (req, res) => {
  const [stats, diagnostics] = await Promise.all([getOverview({ ownerId: ownerIdOf(req) }), getDiagnostics()]);
  ok(res, {
    ...stats,
    diagnostics: {
      ...diagnostics,
      admin: { role: req.user.role, username: req.user.username, email: req.user.loginEmail },
    },
    generatedAt: new Date().toISOString(),
  });
});

/* ---------------------------------------------------------- sub-admins */

// Super-admin only (see the guard at the top). Editing a sub-admin's
// profile, password, status or role goes through PATCH /members/:id.

router.get('/sub-admins', async (req, res) => ok(res, await listSubAdmins()));

router.post('/sub-admins', (req, res) => createMember(req, res, { forceRole: ROLES.SUB_ADMIN }));

/** The sub-admin, their stats, and everything they own. */
router.get('/sub-admins/:subAdminId', async (req, res) => {
  const { subAdminId } = req.params;
  const subAdmin = UUID_PATTERN.test(subAdminId) ? await getSubAdmin(subAdminId) : null;
  if (!subAdmin) return fail(res, 404, 'Sub-admin not found.');

  const [members, plans, products] = await Promise.all([
    listMembers({ createdBy: subAdminId, limit: 100 }),
    listAdminPlans({ createdBy: subAdminId }),
    listProducts({ createdBy: subAdminId, limit: 100 }),
  ]);
  ok(res, { subAdmin, members, plans, products });
});

/** Hands their traders, plans and products back to the super-admin, then deletes the account. */
router.delete('/sub-admins/:subAdminId', async (req, res) => {
  const { subAdminId } = req.params;
  const handedBack = UUID_PATTERN.test(subAdminId)
    ? await deleteSubAdmin({ id: subAdminId, actorId: req.user.id })
    : null;
  if (!handedBack) return fail(res, 404, 'Sub-admin not found.');
  ok(res, { id: subAdminId, handedBack });
});

/* ---------------------------------------------------------- my balance */

// Sub-admin only (see the guard at the top). Requests wait for a
// super-admin in Financials; a sub-admin can't review their own.

router.get('/balance', async (req, res) => {
  const [transactions, wallets] = await Promise.all([
    listTransactions(req.user.id),
    listActiveWallets(),
  ]);
  ok(res, { balance: req.user.balance, transactions: transactions.map(toTransaction), wallets });
});

/** Multipart: `amount`, `walletId`, `receipt` — same as a trader's deposit. */
router.post('/balance/deposits', parseReceipt, receiveDeposit);

/** `{ amount, address }`. Checked against the balance now and again on approval. */
router.post('/balance/withdrawals', async (req, res) => {
  const value = money(req.body?.amount);
  const address = String(req.body?.address ?? '').trim();
  if (!(value > 0)) return fail(res, 400, 'Enter a valid withdrawal amount.');
  if (!address) return fail(res, 400, 'Enter a destination wallet address.');
  if (value > req.user.balance) return fail(res, 400, 'Withdrawal exceeds your available balance.');

  const tx = await createRequest({
    userId: req.user.id,
    type: 'withdrawal',
    amount: value,
    coin: WITHDRAWAL_COIN,
    network: WITHDRAWAL_NETWORK,
    address: address.slice(0, 255),
  });
  ok(res, toTransaction(tx), 201);
});

/* -------------------------------------------------------------- audits */

router.get('/members/:id/audits', async (req, res) => {
  ok(res, await listAuditsForUser(req.member.id));
});

/* ------------------------------------------------------------- errors */

router.use((err, req, res, next) => {
  if (err instanceof LedgerError) return fail(res, err.status, err.message);
  next(err);
});

export default router;
