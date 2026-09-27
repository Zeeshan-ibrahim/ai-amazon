/**
 * Admin panel API. Mounted at `/api/admin` behind `requireRole('admin')`,
 * so every handler here can assume an admin session.
 *
 * Built: members (list, create, particulars, ledger, orders, audits),
 * financials (the deposit/withdrawal review queue), the product catalog,
 * plans and plan requests. Still to come: analytics, banners, wallets.
 */
import { Router } from 'express';
import { withTransaction } from '../db/pool.js';
import { AUDIT, listAuditsForUser, recordAudit } from '../models/audit.js';
import { getMemberRow, listMembers, toMember, updateMember } from '../models/members.js';
import {
  assignOrder,
  listOrdersForUser,
  ORDER_STATUSES,
  removeOrderByAdmin,
  toAdminOrder,
  updateOrderByAdmin,
} from '../models/orders.js';
import {
  archivePlan,
  createPlan,
  listPlanRequests,
  listPlans,
  reviewPlanRequest,
  toPlan,
  updatePlan,
} from '../models/plans.js';
import {
  archiveProduct,
  createProduct,
  listCatalog,
  listProducts,
  toAdminProduct,
  updateProduct,
} from '../models/products.js';
import {
  adjustBalance,
  findTransaction,
  LedgerError,
  listRequests,
  listTransactions,
  reviewTransaction,
  toLedgerEntry,
} from '../models/transactions.js';
import { receiptFile } from '../uploads.js';
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
 */
function readMemberInput(body, { creating }) {
  const changes = {};
  const {
    firstName, lastName, username, phone, email, role, withdrawalLimit, password,
  } = body ?? {};

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

/* ------------------------------------------------------------- members */

router.get('/members', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  ok(res, await listMembers({ q, ...page(req.query, 50) }));
});

router.post('/members', async (req, res) => {
  const { error, changes } = readMemberInput(req.body, { creating: true });
  if (error) return fail(res, 400, error);

  try {
    const member = await withTransaction(async (db) => {
      const row = await createUser(
        {
          ...changes,
          username: changes.username?.trim().replace(/^@/, '') || null,
          role: changes.role ?? ROLES.USER,
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
        details: { email: row.email, role: row.role },
      });
      return getMemberRow(row.id, db);
    });
    ok(res, toMember(member), 201);
  } catch (err) {
    const message = uniqueViolation(err);
    if (message) return fail(res, 409, message);
    throw err;
  }
});

// Every /members/:id route 404s on a malformed or unknown id and gets `req.member`.
router.param('id', async (req, res, next, id) => {
  const row = UUID_PATTERN.test(id) ? await getMemberRow(id) : null;
  if (!row) return fail(res, 404, 'Member not found.');
  req.member = row;
  next();
});

router.get('/members/:id', (req, res) => ok(res, toMember(req.member)));

router.patch('/members/:id', async (req, res) => {
  const { error, changes } = readMemberInput(req.body, { creating: false });
  if (error) return fail(res, 400, error);

  const isSelf = req.member.id === req.user.id;
  if (isSelf && changes.role && changes.role !== req.member.role) {
    return fail(res, 400, "You can't change your own role.");
  }

  try {
    const { row, diff } = await withTransaction(async (db) => {
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
  ok(res, await listRequests({ type, scope, ...page(req.query, 20) }));
});

/** The uploaded receipt image, served inline to admins only. */
router.get('/transactions/:transactionId/receipt', async (req, res) => {
  const tx = UUID_PATTERN.test(req.params.transactionId)
    ? await findTransaction(req.params.transactionId)
    : null;
  if (!tx?.receipt_path) return fail(res, 404, 'Receipt not found.');

  const { filePath, mime } = receiptFile(tx.receipt_path);
  res.sendFile(
    filePath,
    {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
        // The admin app runs on another origin and embeds this with <img>.
        'Cross-Origin-Resource-Policy': 'same-site',
      },
    },
    (err) => err && !res.headersSent && fail(res, 404, 'Receipt not found.')
  );
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
      assignOrder(db, { userId: req.member.id, productId, adminId: req.user.id })
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

router.get('/products', async (req, res) => {
  ok(res, await listProducts(page(req.query, 40)));
});

router.post('/products', async (req, res) => {
  const { error, changes } = readProductInput(req.body, { creating: true });
  if (error) return fail(res, 400, error);
  ok(res, toAdminProduct(await createProduct(changes)), 201);
});

router.patch('/products/:productId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.productId)) return fail(res, 404, 'Product not found.');
  const { error, changes } = readProductInput(req.body, { creating: false });
  if (error) return fail(res, 400, error);

  const row = await updateProduct(req.params.productId, changes);
  if (!row) return fail(res, 404, 'Product not found.');
  ok(res, toAdminProduct(row));
});

router.delete('/products/:productId', async (req, res) => {
  const found =
    UUID_PATTERN.test(req.params.productId) && (await archiveProduct(req.params.productId));
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

router.get('/plans', async (req, res) => ok(res, await listPlans()));

router.post('/plans', async (req, res) => {
  const { error, changes } = readPlanInput(req.body, { creating: true });
  if (error) return fail(res, 400, error);
  ok(res, toPlan(await createPlan(changes)), 201);
});

router.patch('/plans/:planId', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.planId)) return fail(res, 404, 'Plan not found.');
  const { error, changes } = readPlanInput(req.body, { creating: false });
  if (error) return fail(res, 400, error);

  const row = await updatePlan(req.params.planId, changes);
  if (!row) return fail(res, 404, 'Plan not found.');
  ok(res, toPlan(row));
});

router.delete('/plans/:planId', async (req, res) => {
  const found = UUID_PATTERN.test(req.params.planId) && (await archivePlan(req.params.planId));
  if (!found) return fail(res, 404, 'Plan not found.');
  ok(res, { id: req.params.planId });
});

/* ------------------------------------------------------- plan requests */

/** `?scope=active|history&limit=&offset=` */
router.get('/plan-requests', async (req, res) => {
  const { scope = 'active' } = req.query;
  if (scope !== 'active' && scope !== 'history') return fail(res, 400, 'Unknown scope.');
  ok(res, await listPlanRequests({ scope, ...page(req.query, 20) }));
});

const reviewPlan = (approve) => async (req, res) => {
  if (!UUID_PATTERN.test(req.params.contractId)) return fail(res, 404, 'Plan request not found.');
  ok(res, await reviewPlanRequest({ contractId: req.params.contractId, adminId: req.user.id, approve }));
};

router.post('/plan-requests/:contractId/approve', reviewPlan(true));
router.post('/plan-requests/:contractId/reject', reviewPlan(false));

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
