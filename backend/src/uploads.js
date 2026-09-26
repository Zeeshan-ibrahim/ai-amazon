/**
 * Receipt screenshots. Kept on local disk under UPLOAD_DIR/receipts with
 * server-generated names; swap `saveReceipt`/`receiptFile` for object
 * storage when deploying to more than one machine.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const RECEIPT_DIR = path.resolve(process.env.UPLOAD_DIR ?? 'uploads', 'receipts');

/** Identify the image by its bytes — the browser-supplied type is not trusted. */
const SIGNATURES = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: 'png',
    mime: 'image/png',
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
];

const MIME_BY_EXT = Object.fromEntries(SIGNATURES.map((s) => [s.ext, s.mime]));

/** Parses a single `receipt` file field into memory (`req.file`), max 5MB. */
export const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RECEIPT_BYTES, files: 1 },
}).single('receipt');

export class UploadError extends Error {}

/** Validates and writes the image; returns the stored file name. */
export async function saveReceipt(buffer) {
  const kind = SIGNATURES.find((s) => buffer.length > 12 && s.test(buffer));
  if (!kind) throw new UploadError('Receipt must be a JPG, PNG or WEBP image.');

  await mkdir(RECEIPT_DIR, { recursive: true });
  const name = `${randomUUID()}.${kind.ext}`;
  await writeFile(path.join(RECEIPT_DIR, name), buffer, { flag: 'wx' });
  return name;
}

export const discardReceipt = (name) => unlink(path.join(RECEIPT_DIR, path.basename(name))).catch(() => {});

/** Absolute path + content type for a stored receipt name. */
export function receiptFile(name) {
  const safe = path.basename(name);
  return {
    filePath: path.join(RECEIPT_DIR, safe),
    mime: MIME_BY_EXT[path.extname(safe).slice(1)] ?? 'application/octet-stream',
  };
}
