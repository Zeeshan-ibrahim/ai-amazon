/**
 * The trader app (dashboard, products, plans, ledger). Mounted behind
 * `requireRole('user')` — admins get a 403 here and use `/api/admin`.
 *
 * Orders, transactions and balances are in Postgres. Dashboard content and
 * plans are still in-memory demo data until their rules are defined.
 */
import { Router } from 'express';
import * as db from '../data/demo.js';
import { listOrdersForUser, markPurchased, toTraderOrder } from '../models/orders.js';
import {
  createRequest,
  hasApprovedDeposit,
  listTransactions,
  toTransaction,
} from '../models/transactions.js';
import { fail, ok } from './respond.js';

const router = Router();

/* ------------------------------------------------------------- dashboard */

router.get('/dashboard', (req, res) =>
  ok(res, {
    user: req.user,
    stats: db.dashboardStats,
    balance: req.user.balance,
    tutorial: db.tutorial,
    capabilities: db.capabilities,
    campaigns: db.campaigns,
    topEarners: db.topEarners,
  })
);

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

  const balance = req.user.balance;
  if (balance < order.price) {
    return fail(res, 402, 'Insufficient balance to complete this order.', {
      required: order.price,
      current: balance,
      missing: +(order.price - balance).toFixed(2),
    });
  }

  // Settlement rules (balance movement on purchase/sell) aren't defined yet,
  // so purchasing only moves the order to the Sell tab.
  const updated = await markPurchased(order.id, req.user.id);
  if (!updated) return fail(res, 409, 'This order has already been purchased.');
  ok(res, toTraderOrder({ ...order, ...updated }));
});

/* ----------------------------------------------------------------- plans */

router.get('/plans', (req, res) =>
  ok(res, {
    meta: { ...db.planMeta, availableBalance: req.user.balance },
    items: db.plans,
    contracts: db.myContracts,
  })
);

router.post('/plans/:id/activate', (req, res) => {
  const plan = db.plans.find((p) => p.id === req.params.id);
  if (!plan) return fail(res, 404, 'Plan not found.');

  if (req.user.balance < plan.investment) {
    return fail(res, 402, 'Insufficient balance to activate this contract.');
  }
  const contract = {
    id: `CT-${Date.now()}`,
    planId: plan.id,
    planName: plan.name,
    investment: plan.investment,
    totalPayout: plan.totalPayout,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.myContracts.unshift(contract);
  ok(res, contract);
});

/* --------------------------------------------------------------- ledger */

router.get('/transactions', async (req, res) => {
  const limit = Math.max(Number(req.query.limit) || 0, 0);
  ok(res, (await listTransactions(req.user.id, limit)).map(toTransaction));
});

router.get('/deposit-assets', (req, res) => ok(res, db.depositAssets));

/** Records a pending deposit. The balance moves only when an admin approves it. */
router.post('/deposits', async (req, res) => {
  const { amount, assetId, receiptName } = req.body ?? {};
  const asset = db.depositAssets.find((a) => a.id === (assetId ?? 'usdt-trc20'));
  if (!asset) return fail(res, 400, 'Unsupported deposit asset.');

  const value = Math.round(Number(amount) * 100) / 100;
  if (!(value >= asset.minAmount)) {
    return fail(res, 400, `Minimum deposit amount is $${asset.minAmount}.`);
  }

  const tx = await createRequest({
    userId: req.user.id,
    type: 'deposit',
    amount: value,
    asset: `${asset.symbol} ${asset.network}`,
    receiptName: receiptName ? String(receiptName).slice(0, 255) : null,
  });
  ok(res, toTransaction(tx), 201);
});

/**
 * Records a pending withdrawal. Checked against the balance and the member's
 * per-withdrawal limit (0 = no limit); the balance moves on admin approval.
 */
router.post('/withdrawals', async (req, res) => {
  const { amount, address } = req.body ?? {};
  const value = Math.round(Number(amount) * 100) / 100;
  if (!(value > 0)) return fail(res, 400, 'Enter a valid withdrawal amount.');
  if (!String(address ?? '').trim()) return fail(res, 400, 'Enter a destination wallet address.');

  const limit = req.userRow.withdrawal_limit;
  if (limit > 0 && value > limit) {
    return fail(res, 400, `The maximum per withdrawal on this account is $${limit.toFixed(2)}.`);
  }
  if (value > req.user.balance) return fail(res, 400, 'Withdrawal exceeds your available balance.');

  const tx = await createRequest({
    userId: req.user.id,
    type: 'withdrawal',
    amount: value,
    address: String(address).trim().slice(0, 255),
  });
  ok(res, toTransaction(tx), 201);
});

export default router;
