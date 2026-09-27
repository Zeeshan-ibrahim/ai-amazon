/**
 * The trader app (dashboard, products, plans, ledger). Mounted behind
 * `requireRole('user')` — admins get a 403 here and use `/api/admin`.
 *
 * Orders, plans, banners, transactions and balances are in Postgres. The
 * rest of the dashboard content is still in-memory demo data.
 */
import { Router } from 'express';
import * as db from '../data/demo.js';
import { listOrdersForUser, purchaseOrder, sellOrder, toTraderOrder } from '../models/orders.js';
import { listBanners } from '../models/banners.js';
import { activatePlan, listContractsForUser, listPlans } from '../models/plans.js';
import {
  createRequest,
  hasApprovedDeposit,
  LedgerError,
  listTransactions,
  toTransaction,
} from '../models/transactions.js';
import multer from 'multer';
import { findById, UUID_PATTERN, verifySecret } from '../models/users.js';
import { getSettings } from '../models/settings.js';
import { findActiveWallet, listActiveWallets } from '../models/wallets.js';
import { discardReceipt, MAX_RECEIPT_BYTES, receiptUpload, saveReceipt, UploadError } from '../uploads.js';
import { fail, ok } from './respond.js';

const MIN_DEPOSIT = 10;

// The withdraw form only takes USDT on TRON today.
const WITHDRAWAL_COIN = 'USDT';
const WITHDRAWAL_NETWORK = 'TRC20';

const router = Router();

/* ------------------------------------------------------------- dashboard */

/**
 * `banners` is the admin-managed list from the Banners section;
 * `supportUrl` is the Telegram link from Wallets & Support (or null).
 */
router.get('/dashboard', async (req, res) => {
  const [banners, settings] = await Promise.all([listBanners(), getSettings()]);
  ok(res, {
    user: req.user,
    stats: db.dashboardStats,
    balance: req.user.balance,
    tutorial: db.tutorial,
    capabilities: db.capabilities,
    banners,
    supportUrl: settings.telegramSupportUrl,
    topEarners: db.topEarners,
  });
});

router.get('/deposits/live', (req, res) => ok(res, db.liveDeposits));

/* -------------------------------------------------------------- products */

/**
 * Orders an admin assigned to this trader. They stay hidden — the list is
 * empty and `meta.depositRequired` is true — until the trader has at least
 * one approved deposit.
 */
router.get('/products', async (req, res) => {
  const unlocked = await hasApprovedDeposit(req.user.id);
  const orders = unlocked ? (await listOrdersForUser(req.user.id)).map(toTraderOrder) : [];

  const { tab, state } = req.query;
  let items = orders;
  if (tab) items = items.filter((p) => p.tab === tab);
  if (state) items = items.filter((p) => p.state === state);
  const count = (t) => orders.filter((p) => p.tab === t).length;

  ok(res, {
    meta: {
      ...db.productsMeta,
      completed: count('completed'),
      availableBalance: req.user.balance,
      depositRequired: !unlocked,
    },
    items,
    counts: { purchase: count('purchase'), sell: count('sell'), completed: count('completed') },
  });
});

router.post('/products/:id/purchase', async (req, res) => {
  const unlocked = await hasApprovedDeposit(req.user.id);
  const order = unlocked
    ? (await listOrdersForUser(req.user.id)).find((o) => o.id === req.params.id)
    : null;
  if (!order) return fail(res, 404, 'Order not found.');
  if (order.status !== 'assigned') return fail(res, 409, 'This order has already been purchased.');

  const insufficient = (current) =>
    fail(res, 402, 'Insufficient balance to complete this order.', {
      required: order.price,
      current,
      missing: +(order.price - current).toFixed(2),
    });
  if (req.user.balance < order.price) return insufficient(req.user.balance);

  let updated;
  try {
    updated = await purchaseOrder(order.id, req.user.id);
  } catch (err) {
    // The balance changed between the check above and the debit.
    if (err instanceof LedgerError) return insufficient((await findById(req.user.id)).balance);
    throw err;
  }
  if (!updated) return fail(res, 409, 'This order has already been purchased.');
  ok(res, toTraderOrder({ ...order, ...updated }));
});

/** Sells a purchased order: credits price + profit and moves it to Completed. */
router.post('/products/:id/sell', async (req, res) => {
  const unlocked = await hasApprovedDeposit(req.user.id);
  const order = unlocked
    ? (await listOrdersForUser(req.user.id)).find((o) => o.id === req.params.id)
    : null;
  if (!order) return fail(res, 404, 'Order not found.');
  if (order.status === 'assigned') return fail(res, 409, 'Purchase this order before selling it.');
  if (order.status === 'completed') return fail(res, 409, 'This order has already been sold.');

  const updated = await sellOrder(order.id, req.user.id);
  if (!updated) return fail(res, 409, 'This order has already been sold.');
  ok(res, toTraderOrder({ ...order, ...updated }));
});

/* ----------------------------------------------------------------- plans */

/** The same live plan list the admin manages, plus this trader's contracts. */
router.get('/plans', async (req, res) => {
  const [items, contracts] = await Promise.all([listPlans(), listContractsForUser(req.user.id)]);
  ok(res, {
    meta: { ...db.planMeta, availableBalance: req.user.balance },
    items,
    contracts,
  });
});

/**
 * Debits the plan's price and records a `PENDING` contract for admin review.
 * `402` with `{ required, current, missing }` when the balance is short.
 */
router.post('/plans/:id/activate', async (req, res) => {
  const plan = UUID_PATTERN.test(req.params.id)
    ? (await listPlans()).find((p) => p.id === req.params.id)
    : null;
  if (!plan) return fail(res, 404, 'This plan is no longer available.');

  const insufficient = (current) =>
    fail(res, 402, 'Insufficient balance to activate this plan.', {
      required: plan.price,
      current,
      missing: +(plan.price - current).toFixed(2),
    });
  if (req.user.balance < plan.price) return insufficient(req.user.balance);

  let contract;
  try {
    contract = await activatePlan({ userId: req.user.id, planId: plan.id });
  } catch (err) {
    // The balance changed between the check above and the debit.
    if (err instanceof LedgerError) return insufficient((await findById(req.user.id)).balance);
    if (err.code === '23505') return fail(res, 409, 'You already have a pending request for this plan.');
    throw err;
  }
  if (!contract) return fail(res, 404, 'This plan is no longer available.');
  ok(res, contract, 201);
});

/* --------------------------------------------------------------- ledger */

const TRANSACTION_TYPES = [
  'deposit',
  'withdrawal',
  'adjustment',
  'order_purchase',
  'order_sale',
  'plan_activation',
  'plan_refund',
];

/** `?type=` narrows to one type (Deposit / Withdrawal Records); `?limit=` caps the count. */
router.get('/transactions', async (req, res) => {
  const limit = Math.max(Number(req.query.limit) || 0, 0);
  const { type } = req.query;
  if (type !== undefined && !TRANSACTION_TYPES.includes(type)) {
    return fail(res, 400, 'Unknown transaction type.');
  }
  ok(res, (await listTransactions(req.user.id, { limit, type })).map(toTransaction));
});

router.get('/faq', (req, res) => ok(res, db.faq));

/** Company wallets a trader can pay into (Deposit Center step 2). */
router.get('/wallets', async (req, res) => ok(res, await listActiveWallets()));

/** Runs the multer parser and turns its errors into 400s. */
const parseReceipt = (req, res, next) =>
  receiptUpload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return fail(
        res,
        400,
        err.code === 'LIMIT_FILE_SIZE'
          ? `Receipt must be ${MAX_RECEIPT_BYTES / 1024 / 1024}MB or smaller.`
          : 'Upload a single receipt image.'
      );
    }
    next(err);
  });

/**
 * Multipart: `amount`, `walletId`, `receipt` (JPG/PNG/WEBP, max 5MB).
 * Records a pending deposit; the balance moves only when an admin approves it.
 */
router.post('/deposits', parseReceipt, async (req, res) => {
  const { amount, walletId } = req.body ?? {};
  const value = Math.round(Number(amount) * 100) / 100;
  if (!(value >= MIN_DEPOSIT)) return fail(res, 400, `Minimum deposit amount is $${MIN_DEPOSIT}.`);

  const wallet = UUID_PATTERN.test(String(walletId)) ? await findActiveWallet(walletId) : null;
  if (!wallet) return fail(res, 400, 'Choose one of the listed payment wallets.');
  if (!req.file) return fail(res, 400, 'Upload a screenshot of your payment receipt.');

  let stored;
  try {
    stored = await saveReceipt(req.file.buffer);
  } catch (err) {
    if (err instanceof UploadError) return fail(res, 400, err.message);
    throw err;
  }

  try {
    const tx = await createRequest({
      userId: req.user.id,
      type: 'deposit',
      amount: value,
      coin: wallet.coin,
      network: wallet.network,
      address: wallet.address,
      walletId: wallet.id,
      receiptName: req.file.originalname.slice(0, 255),
      receiptPath: stored,
    });
    ok(res, { ...toTransaction(tx), coin: tx.coin, network: tx.network }, 201);
  } catch (err) {
    await discardReceipt(stored);
    throw err;
  }
});

/**
 * Records a pending withdrawal, authorized by the withdrawal PIN. Checked against the balance and the
 * per-withdrawal limit — the member's own, else the global one (0 = no limit); the balance moves on admin approval.
 */
router.post('/withdrawals', async (req, res) => {
  const { amount, address, pin } = req.body ?? {};
  const value = Math.round(Number(amount) * 100) / 100;
  if (!(value > 0)) return fail(res, 400, 'Enter a valid withdrawal amount.');
  if (!String(address ?? '').trim()) return fail(res, 400, 'Enter a destination wallet address.');

  const pinHash = req.userRow.withdrawal_pin_hash;
  if (!pinHash) {
    return fail(res, 400, 'Set a withdrawal PIN under Settings → Manage Settings before withdrawing.');
  }
  if (!pin || !(await verifySecret(String(pin), pinHash))) {
    return fail(res, 400, 'Withdrawal PIN is incorrect.');
  }

  // The member's own limit wins; otherwise the group-wide one. 0 = no limit.
  const limit = req.userRow.withdrawal_limit || (await getSettings()).globalWithdrawalLimit;
  if (limit > 0 && value > limit) {
    return fail(res, 400, `The maximum per withdrawal on this account is $${limit.toFixed(2)}.`);
  }
  if (value > req.user.balance) return fail(res, 400, 'Withdrawal exceeds your available balance.');

  const tx = await createRequest({
    userId: req.user.id,
    type: 'withdrawal',
    amount: value,
    coin: WITHDRAWAL_COIN,
    network: WITHDRAWAL_NETWORK,
    address: String(address).trim().slice(0, 255),
  });
  ok(res, toTransaction(tx), 201);
});

export default router;
