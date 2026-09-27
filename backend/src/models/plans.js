import { pool, withTransaction } from '../db/pool.js';
import { AUDIT, recordAudit } from './audit.js';
import { LedgerError, recordSettlement } from './transactions.js';
import { displayNameOf } from './users.js';

/** Both apps' view — matches `Plan` in frontend/src/lib/types.ts. */
export const toPlan = (row) => ({
  id: row.id,
  name: row.name,
  tag: row.tag,
  description: row.description,
  price: row.price,
  image: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * The live plan list. The admin Plans screen and the trader's /plans read
 * this same query, so both always show the same plans.
 */
export async function listPlans() {
  const { rows } = await pool.query(
    'SELECT * FROM plans WHERE is_active ORDER BY price, created_at, id'
  );
  return rows.map(toPlan);
}

export async function createPlan({ name, tag, description, price, imageUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO plans (name, tag, description, price, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, tag, description, price, imageUrl]
  );
  return rows[0];
}

const EDITABLE = {
  name: 'name',
  tag: 'tag',
  description: 'description',
  price: 'price',
  imageUrl: 'image_url',
};

/**
 * Applies only the fields present in `changes`. Existing contracts keep the
 * price they were activated at. Returns the row, or null for an unknown or
 * deleted plan.
 */
export async function updatePlan(id, changes) {
  const sets = [];
  const params = [id];
  for (const [key, column] of Object.entries(EDITABLE)) {
    if (changes[key] === undefined) continue;
    params.push(changes[key]);
    sets.push(`${column} = $${params.length}`);
  }
  if (!sets.length) {
    const { rows } = await pool.query('SELECT * FROM plans WHERE id = $1 AND is_active', [id]);
    return rows[0] ?? null;
  }
  const { rows } = await pool.query(
    `UPDATE plans SET ${sets.join(', ')} WHERE id = $1 AND is_active RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

/**
 * Hides a plan from traders. It's a soft delete: members' existing
 * contracts still point at it and carry on as normal.
 */
export async function archivePlan(id) {
  const { rowCount } = await pool.query(
    'UPDATE plans SET is_active = false WHERE id = $1 AND is_active',
    [id]
  );
  return rowCount > 0;
}

/* ------------------------------------------------------------ contracts */

/** The trader's view — matches `Contract` in frontend/src/lib/types.ts. */
export const toContract = (row) => ({
  id: row.id,
  planId: row.plan_id,
  planName: row.name,
  tag: row.tag,
  price: row.price,
  status: row.status.toUpperCase(),
  createdAt: row.created_at,
});

export async function listContractsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT c.*, p.name, p.tag
       FROM plan_contracts c JOIN plans p ON p.id = c.plan_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows.map(toContract);
}

/**
 * Activates a plan for a trader: copies its current price onto a pending
 * contract and debits that from the balance, with the ledger row and audit
 * entry, all in one transaction. Returns null for an unknown or deleted
 * plan. Throws `LedgerError` (409) when the balance is short, and a unique
 * violation (23505) when this plan already has a pending request.
 */
export function activatePlan({ userId, planId }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO plan_contracts (user_id, plan_id, price)
       SELECT $1, p.id, p.price FROM plans p WHERE p.id = $2 AND p.is_active
       RETURNING *`,
      [userId, planId]
    );
    const contract = rows[0];
    if (!contract) return null;

    const { transaction, balance } = await recordSettlement(db, {
      userId,
      planContractId: contract.id,
      type: 'plan_activation',
      amount: contract.price,
    });
    await recordAudit(db, {
      actorId: userId,
      targetUserId: userId,
      action: AUDIT.PLAN_ACTIVATED,
      details: { contractId: contract.id, planId, transactionId: transaction.id, amount: contract.price, balance },
    });

    const { rows: plan } = await db.query('SELECT name, tag FROM plans WHERE id = $1', [planId]);
    return toContract({ ...contract, ...plan[0] });
  });
}

/* -------------------------------------------------------- plan requests */

/** A contract in the admin Plan Requests queue. */
const toPlanRequest = (row) => ({
  ...toContract(row),
  image: row.image_url,
  reviewedAt: row.reviewed_at,
  member: { id: row.user_id, displayName: displayNameOf(row), email: row.email },
});

/**
 * The Plan Requests queue across all members. `scope: 'active'` is pending
 * requests, newest first; `'history'` is everything already approved or
 * rejected, most recently reviewed first. Also returns the pending count.
 */
export async function listPlanRequests({ scope, limit, offset }) {
  const status = scope === 'active' ? "c.status = 'pending'" : "c.status <> 'pending'";
  const order = scope === 'active' ? 'c.created_at DESC' : 'c.reviewed_at DESC NULLS LAST, c.created_at DESC';
  const [{ rows }, { rows: countRows }, { rows: pendingRows }] = await Promise.all([
    pool.query(
      `SELECT c.*, p.name, p.tag, p.image_url, u.first_name, u.last_name, u.username, u.email
         FROM plan_contracts c
         JOIN plans p ON p.id = c.plan_id
         JOIN users u ON u.id = c.user_id
        WHERE ${status}
        ORDER BY ${order}
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query(`SELECT count(*)::int AS total FROM plan_contracts c WHERE ${status}`),
    pool.query("SELECT count(*)::int AS n FROM plan_contracts WHERE status = 'pending'"),
  ]);
  return { total: countRows[0].total, pending: pendingRows[0].n, items: rows.map(toPlanRequest) };
}

/**
 * Approves or rejects a pending plan request. The price was debited at
 * activation, so approval only activates the contract; rejection refunds the
 * price to the member's balance as a `plan_refund` ledger row. Throws
 * `LedgerError` for an unknown or already-reviewed request.
 */
export function reviewPlanRequest({ contractId, adminId, approve }) {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `UPDATE plan_contracts
          SET status = $2, reviewed_by = $3, reviewed_at = now()
        WHERE id = $1 AND status = 'pending'
        RETURNING *`,
      [contractId, approve ? 'active' : 'rejected', adminId]
    );
    const contract = rows[0];
    if (!contract) {
      const { rows: existing } = await db.query('SELECT status FROM plan_contracts WHERE id = $1', [contractId]);
      if (!existing[0]) throw new LedgerError(404, 'Plan request not found.');
      throw new LedgerError(409, `This request is already ${existing[0].status === 'active' ? 'approved' : existing[0].status}.`);
    }

    const refund = approve
      ? null
      : await recordSettlement(db, {
          userId: contract.user_id,
          planContractId: contract.id,
          type: 'plan_refund',
          amount: contract.price,
        });
    await recordAudit(db, {
      actorId: adminId,
      targetUserId: contract.user_id,
      action: approve ? AUDIT.PLAN_APPROVED : AUDIT.PLAN_REJECTED,
      details: {
        contractId: contract.id,
        planId: contract.plan_id,
        amount: contract.price,
        ...(refund && { transactionId: refund.transaction.id, balance: refund.balance }),
      },
    });

    const { rows: full } = await db.query(
      `SELECT c.*, p.name, p.tag, p.image_url, u.first_name, u.last_name, u.username, u.email
         FROM plan_contracts c
         JOIN plans p ON p.id = c.plan_id
         JOIN users u ON u.id = c.user_id
        WHERE c.id = $1`,
      [contract.id]
    );
    return toPlanRequest(full[0]);
  });
}
