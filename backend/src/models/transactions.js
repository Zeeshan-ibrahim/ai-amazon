import { pool, withTransaction } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';

export class LedgerError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function titleFor(row) {
  if (row.type === 'deposit') return `Deposit request (${row.asset ?? 'crypto'})`;
  if (row.type === 'withdrawal') return 'Withdrawal request';
  return row.direction === 'credit' ? 'Balance credit' : 'Balance debit';
}

/** The trader's view — matches `Transaction` in frontend/src/lib/types.ts. */
export const toTransaction = (row) => ({
  id: row.id,
  title: titleFor(row),
  createdAt: row.created_at,
  status: row.status.toUpperCase(),
  amount: row.amount,
  direction: row.direction,
});

/** The admin's view: everything, including the internal note. */
export const toLedgerEntry = (row) => ({
  ...toTransaction(row),
  type: row.type,
  asset: row.asset,
  address: row.address,
  receiptName: row.receipt_name,
  note: row.note,
  reviewedAt: row.reviewed_at,
});

export async function listTransactions(userId, limit = 0) {
  const { rows } = await pool.query(
    `SELECT * FROM transactions WHERE user_id = $1
      ORDER BY created_at DESC ${limit ? 'LIMIT $2' : ''}`,
    limit ? [userId, limit] : [userId]
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
export function createRequest({ userId, type, amount, asset, address, receiptName }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO transactions (user_id, type, direction, amount, asset, address, receipt_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, type, type === 'deposit' ? 'credit' : 'debit', amount, asset, address, receiptName]
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

/** Approve or reject a pending deposit/withdrawal. Approval moves the balance. */
export function reviewTransaction({ transactionId, adminId, approve, note }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [
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
