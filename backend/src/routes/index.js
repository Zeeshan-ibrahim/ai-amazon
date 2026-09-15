import { Router } from 'express';
import * as db from '../data/demo.js';

const router = Router();

/** Uniform envelope so the frontend always reads `data`. */
const ok = (res, data) => res.json({ success: true, data });

/* ------------------------------------------------------------------ auth */

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email and password are required.' });
  }
  ok(res, { token: 'demo-token', user: db.user });
});

router.post('/auth/signup', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Email and password are required.' });
  }
  ok(res, { token: 'demo-token', user: { ...db.user, email } });
});

router.post('/auth/forgot-password', (req, res) =>
  ok(res, { message: 'If that account exists, a reset link has been sent.' })
);

/* ------------------------------------------------------------------ user */

router.get('/me', (req, res) => ok(res, db.user));

router.patch('/me', (req, res) => {
  Object.assign(db.user, req.body ?? {});
  ok(res, db.user);
});

router.put('/me/password', (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'All password fields are required.' });
  }
  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: 'Passwords do not match.' });
  }
  ok(res, { message: 'Password updated.' });
});

router.put('/me/language', (req, res) => {
  db.user.language = req.body?.language ?? db.user.language;
  ok(res, { language: db.user.language });
});

/* ------------------------------------------------------------- dashboard */

router.get('/dashboard', (req, res) =>
  ok(res, {
    user: db.user,
    stats: db.dashboardStats,
    balance: db.user.balance,
    tutorial: db.tutorial,
    capabilities: db.capabilities,
    campaigns: db.campaigns,
    topEarners: db.topEarners,
  })
);

router.get('/deposits/live', (req, res) => ok(res, db.liveDeposits));

/* -------------------------------------------------------------- products */

router.get('/products', (req, res) => {
  const { tab, state } = req.query;
  let items = db.products;
  if (tab) items = items.filter((p) => p.tab === tab);
  if (state) items = items.filter((p) => p.state === state);

  ok(res, {
    meta: { ...db.productsMeta, availableBalance: db.productsMeta.availableBalance },
    items,
    counts: {
      purchase: db.products.filter((p) => p.tab === 'purchase').length,
      sell: db.products.filter((p) => p.tab === 'sell').length,
      completed: db.products.filter((p) => p.tab === 'completed').length,
    },
  });
});

router.post('/products/:id/purchase', (req, res) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  if (db.productsMeta.availableBalance < product.amount) {
    return res.status(402).json({
      success: false,
      message: 'Insufficient balance to complete this order.',
      data: {
        required: product.amount,
        current: db.productsMeta.availableBalance,
        missing: +(product.amount - db.productsMeta.availableBalance).toFixed(2),
      },
    });
  }
  product.tab = 'sell';
  ok(res, product);
});

/* ----------------------------------------------------------------- plans */

router.get('/plans', (req, res) =>
  ok(res, { meta: db.planMeta, items: db.plans, contracts: db.myContracts })
);

router.post('/plans/:id/activate', (req, res) => {
  const plan = db.plans.find((p) => p.id === req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found.' });
  }
  if (db.planMeta.availableBalance < plan.investment) {
    return res.status(402).json({
      success: false,
      message: 'Insufficient balance to activate this contract.',
    });
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

router.get('/transactions', (req, res) => {
  const limit = Number(req.query.limit ?? 0);
  ok(res, limit ? db.transactions.slice(0, limit) : db.transactions);
});

router.get('/deposit-assets', (req, res) => ok(res, db.depositAssets));

router.post('/deposits', (req, res) => {
  const { amount, assetId } = req.body ?? {};
  if (!amount || Number(amount) < 10) {
    return res
      .status(400)
      .json({ success: false, message: 'Minimum deposit amount is $10.' });
  }
  const tx = {
    id: `tx_${Date.now()}`,
    title: `Deposit request broadcast (${assetId ?? 'usdt-trc20'})`,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    amount: Number(amount),
    direction: 'credit',
  };
  db.transactions.unshift(tx);
  ok(res, tx);
});

router.post('/withdrawals', (req, res) => {
  const { amount } = req.body ?? {};
  if (!amount || Number(amount) <= 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Enter a valid withdrawal amount.' });
  }
  const tx = {
    id: `tx_${Date.now()}`,
    title: 'Withdrawal request submitted',
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    amount: Number(amount),
    direction: 'debit',
  };
  db.transactions.unshift(tx);
  ok(res, tx);
});

/* -------------------------------------------------------------- settings */

router.get('/languages', (req, res) => ok(res, db.languages));

export default router;
