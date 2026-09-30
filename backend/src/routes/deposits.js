/**
 * The deposit-with-receipt request, shared by traders (`POST /deposits`) and
 * sub-admins (`POST /admin/balance/deposits`). Either way it only records a
 * pending request; the balance moves when the reviewer approves it.
 */
import multer from 'multer';
import { createRequest, toTransaction } from '../models/transactions.js';
import { UUID_PATTERN } from '../models/users.js';
import { findActiveWallet } from '../models/wallets.js';
import { discardReceipt, MAX_RECEIPT_BYTES, receiptUpload, saveReceipt, UploadError } from '../uploads.js';
import { fail, ok } from './respond.js';

export const MIN_DEPOSIT = 10;

/** Runs the multer parser and turns its errors into 400s. */
export const parseReceipt = (req, res, next) =>
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
 * Multipart: `amount`, `walletId`, `receipt` (JPG/PNG/WEBP, max 4MB), after
 * `parseReceipt`. Records a pending deposit for the signed-in account.
 */
export async function receiveDeposit(req, res) {
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
}
