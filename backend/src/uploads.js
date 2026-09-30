/**
 * Receipt screenshots, stored under server-generated names. With
 * SUPABASE_URL set they go to a private Supabase Storage bucket (required on
 * Vercel, whose filesystem does not persist); otherwise they stay on local
 * disk under UPLOAD_DIR/receipts for development.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';

// Vercel rejects request bodies over 4.5MB, so stay under that.
export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

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

const mimeOf = (name) => MIME_BY_EXT[path.extname(name).slice(1)] ?? 'application/octet-stream';

/* ------------------------------------------------------------- storage */

/** Private Supabase Storage bucket, reached with the service-role key. */
function supabaseStore() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET = 'receipts' } = process.env;
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');

  const bucket = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(SUPABASE_BUCKET);

  return {
    async put(name, buffer, mime) {
      const { error } = await bucket.upload(name, buffer, { contentType: mime, upsert: false });
      if (error) throw error;
    },
    async get(name) {
      const { data, error } = await bucket.download(name);
      return error ? null : Buffer.from(await data.arrayBuffer());
    },
    async remove(name) {
      await bucket.remove([name]);
    },
  };
}

/** Local folder, for development without Supabase. */
function diskStore() {
  const dir = path.resolve(process.env.UPLOAD_DIR ?? 'uploads', 'receipts');
  return {
    async put(name, buffer) {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), buffer, { flag: 'wx' });
    },
    get: (name) => readFile(path.join(dir, name)).catch(() => null),
    remove: (name) => unlink(path.join(dir, name)),
  };
}

const store = process.env.SUPABASE_URL ? supabaseStore() : diskStore();

/* ----------------------------------------------------------------- API */

/** Parses a single `receipt` file field into memory (`req.file`), max 4MB. */
export const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RECEIPT_BYTES, files: 1 },
}).single('receipt');

export class UploadError extends Error {}

/** Validates and stores the image; returns the stored file name. */
export async function saveReceipt(buffer) {
  const kind = SIGNATURES.find((s) => buffer.length > 12 && s.test(buffer));
  if (!kind) throw new UploadError('Receipt must be a JPG, PNG or WEBP image.');

  const name = `${randomUUID()}.${kind.ext}`;
  await store.put(name, buffer, kind.mime);
  return name;
}

export const discardReceipt = (name) => store.remove(path.basename(name)).catch(() => {});

/** Bytes + content type for a stored receipt name, or null if it is gone. */
export async function readReceipt(name) {
  const safe = path.basename(name);
  const buffer = await store.get(safe);
  return buffer && { buffer, mime: mimeOf(safe) };
}
