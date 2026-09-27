import { pool, withTransaction } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';
import { displayNameOf, ownedUserSql } from './users.js';

export class LedgerError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const via = (row) => (row.coin ? ` (${[row.coin, row.network].filter(Boolean).join(' ')})` : '');

const product = (row) => (row.product_title ? `: ${row.product_title}` : '');

const plan = (row) => (row.plan_name ? `: ${row.plan_name}` : '');

function titleFor(row) {
  if (row.type === 'deposit') return `Deposit request${via(row)}`;
  if (row.type === 'withdrawal') return `Withdrawal request${via(row)}`;
  if (row.type === 'order_purchase') return `Order purchase${product(row)}`;
  if (row.type === 'order_sale') return `Order sale${product(row)}`;
  if (row.type === 'plan_activation') return `Plan activation${plan(row)}`;
  if (row.type === 'plan_refund') return `Plan refund${plan(row)}`;
  return row.direction === 'credit' ? 'Balance credit' : 'Balance debit';
}

/** What both apps display. An approved request reads as completed. */
const STATUS_LABELS = { pending: 'PENDING', approved: 'COMPLETED', rejected: 'REJECTED' };

/** The trader's view — matches `Transaction` in frontend/src/lib/types.ts. */
export const toTransaction = (row) => ({
  id: row.id,
  type: row.type,
  title: titleFor(row),
  createdAt: row.created_at,
  status: STATUS_LABELS[row.status],
  amount: row.amount,
  direction: row.direction,
  coin: row.coin,
  network: row.network,
  address: row.address,
  reviewedAt: row.reviewed_at,
});

/** The admin's view: everything, including the internal note. */
export const toLedgerEntry = (row) => ({
  ...toTransaction(row),
  receiptName: row.receipt_name,
  hasReceipt: row.receipt_path !== null,
  note: row.note,
});

/** A sub-admin (`$1` = their id) only reaches their own users' rows; a super-admin ($1 null) all. */
const SCOPED = `($1::uuid IS NULL OR ${ownedUserSql('t.user_id', '$1')})`;

/** The row, or null if unknown or outside a sub-admin's (`ownerId`) users. */
export async function findTransaction(id, { ownerId = null } = {}) {
  const { rows } = await pool.query(`SELECT * FROM transactions t WHERE t.id = $2 AND ${SCOPED}`, [
    ownerId,
    id,
  ]);
  return rows[0] ?? null;
}

/**
 * The Financials queue. `scope: 'active'` is pending requests; `'history'`
 * is everything already approved or rejected. Also returns how many of each
 * type are pending, for the tab badges. `ownerId` limits it to one
 * sub-admin's users; a super-admin also sees sub-admins' own requests,
 * marked by `member.role`.
 */
export async function listRequests({ type, scope, limit, offset, ownerId = null }) {
  const status = scope === 'active' ? "t.status = 'pending'" : "t.status <> 'pending'";
  const order = scope === 'active' ? 't.created_at DESC' : 't.reviewed_at DESC NULLS LAST, t.created_at DESC';
  const [{ rows }, { rows: countRows }, { rows: pendingRows }] = await Promise.all([
    pool.query(
      `SELECT t.*, u.first_name, u.last_name, u.username, u.email, u.role AS member_role
         FROM transactions t JOIN users u ON u.id = t.user_id
        WHERE t.type = $2 AND ${status} AND ${SCOPED}
        ORDER BY ${order}
        LIMIT $3 OFFSET $4`,
      [ownerId, type, limit, offset]
    ),
    pool.query(
      `SELECT count(*)::int AS total FROM transactions t WHERE t.type = $2 AND ${status} AND ${SCOPED}`,
      [ownerId, type]
    ),
    pool.query(
      `SELECT t.type, count(*)::int AS n FROM transactions t
        WHERE t.status = 'pending' AND t.type IN ('deposit', 'withdrawal') AND ${SCOPED}
        GROUP BY t.type`,
      [ownerId]
    ),
  ]);

  const pending = { deposit: 0, withdrawal: 0 };
  for (const r of pendingRows) pending[r.type] = r.n;

  return {
    total: countRows[0].total,
    pending,
    items: rows.map((row) => ({
      ...toLedgerEntry(row),
      member: { id: row.user_id, displayName: displayNameOf(row), email: row.email, role: row.member_role },
    })),
  };
}

/** A member's ledger, newest first. `type` narrows it to one transaction type. */
export async function listTransactions(userId, { limit = 0, type } = {}) {
  const params = [userId];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const typeFilter = type ? `AND t.type = ${add(type)}` : '';
  const limitClause = limit ? `LIMIT ${add(limit)}` : '';
  const { rows } = await pool.query(
    `SELECT t.*, p.title AS product_title, pl.name AS plan_name
       FROM transactions t
       LEFT JOIN orders o ON o.id = t.order_id
       LEFT JOIN products p ON p.id = o.product_id
       LEFT JOIN plan_contracts c ON c.id = t.plan_contract_id
       LEFT JOIN plans pl ON pl.id = c.plan_id
      WHERE t.user_id = $1 ${typeFilter}
      ORDER BY t.created_at DESC ${limitClause}`,
    params
  );
  return rows;
}

/** The rule that unlocks assigned orders for a trader. */
export async function hasApprovedDeposit(userId, db = pool) {
  const { rows } = await db.query(
    `SELECT EXISTS (
       SELECT 1 FROM transactions
        WHERE user_id = $1 AND type = 'deposit' AND status = 'approved'
     ) AS ok`,
    [userId]
  );
  return rows[0].ok;
}

/** A trader's deposit or withdrawal request. Does not move the balance. */
export function createRequest({
  userId,
  type,
  amount,
  coin,
  network,
  address,
  walletId = null,
  receiptName = null,
  receiptPath = null,
}) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO transactions
         (user_id, type, direction, amount, coin, network, address, wallet_id, receipt_name, receipt_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, type, type === 'deposit' ? 'credit' : 'debit', amount, coin, network, address,
        walletId, receiptName, receiptPath]
    );
    await recordAudit(db, {
      actorId: userId,
      targetUserId: userId,
      action: type === 'deposit' ? AUDIT.DEPOSIT_REQUESTED : AUDIT.WITHDRAWAL_REQUESTED,
      details: { transactionId: rows[0].id, amount },
    });
    return rows[0];
  });
}

/** Moves `amount` into or out of the balance; refuses to go below zero. */
async function applyToBalance(db, userId, direction, amount) {
  const { rows } = await db.query(
    direction === 'credit'
      ? 'UPDATE users SET balance = balance + $2 WHERE id = $1 RETURNING balance'
      : 'UPDATE users SET balance = balance - $2 WHERE id = $1 AND balance >= $2 RETURNING balance',
    [userId, amount]
  );
  if (!rows[0]) throw new LedgerError(409, 'Insufficient balance for this debit.');
  return rows[0].balance;
}

/**
 * Moves the balance for an order purchase (debit), order sale (credit),
 * plan activation (debit) or plan refund (credit) and records it as an
 * approved ledger row linked by `orderId` or `planContractId`. Run inside the
 * caller's transaction. Throws `LedgerError` (409) when a debit would
 * overdraw the balance.
 */
const CREDIT_SETTLEMENTS = ['order_sale', 'plan_refund'];

export async function recordSettlement(db, { userId, orderId = null, planContractId = null, type, amount }) {
  const direction = CREDIT_SETTLEMENTS.includes(type) ? 'credit' : 'debit';
  const balance = await applyToBalance(db, userId, direction, amount);
  const { rows } = await db.query(
    `INSERT INTO transactions
       (user_id, order_id, plan_contract_id, type, direction, amount, status, reviewed_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'approved', now())
     RETURNING *`,
    [userId, orderId, planContractId, type, direction, amount]
  );
  return { transaction: rows[0], balance };
}

/**
 * Approve or reject a pending deposit/withdrawal. Approval moves the balance.
 * A sub-admin (`ownerId`) can only review their own users' requests, so
 * their own requests always go to a super-admin.
 */
export function reviewTransaction({ transactionId, adminId, approve, note, ownerId = null }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(`SELECT * FROM transactions t WHERE t.id = $2 AND ${SCOPED} FOR UPDATE`, [
      ownerId,
      transactionId,
    ]);
    const tx = rows[0];
    if (!tx) throw new LedgerError(404, 'Transaction not found.');
    if (tx.status !== 'pending') {
      throw new LedgerError(409, `This transaction is already ${tx.status}.`);
    }

    const balance = approve
      ? await applyToBalance(db, tx.user_id, tx.direction, tx.amount)
      : null;

    const { rows: updated } = await db.query(
      `UPDATE transactions
          SET status = $2, reviewed_by = $3, reviewed_at = now(), note = COALESCE($4, note)
        WHERE id = $1
        RETURNING *`,
      [tx.id, approve ? 'approved' : 'rejected', adminId, note || null]
    );
    await recordAudit(db, {
      actorId: adminId,
      targetUserId: tx.user_id,
      action: approve ? AUDIT.TRANSACTION_APPROVED : AUDIT.TRANSACTION_REJECTED,
      details: { transactionId: tx.id, type: tx.type, amount: tx.amount, ...(note && { note }), ...(balance !== null && { balance }) },
    });
    return updated[0];
  });
}

/** Admin credit/debit, effective immediately. Does not count as a deposit. */
export function adjustBalance({ userId, adminId, direction, amount, note }) {
  return withTransaction(async (db) => {
    const balance = await applyToBalance(db, userId, direction, amount);
    const { rows } = await db.query(
      `INSERT INTO transactions
         (user_id, type, direction, amount, status, note, reviewed_by, reviewed_at)
       VALUES ($1, 'adjustment', $2, $3, 'approved', $4, $5, now())
       RETURNING *`,
      [userId, direction, amount, note || null, adminId]
    );
    await recordAudit(db, {
      actorId: adminId,
      targetUserId: userId,
      action: AUDIT.BALANCE_ADJUSTED,
      details: { transactionId: rows[0].id, direction, amount, balance, ...(note && { note }) },
    });
    return rows[0];
  });
}
