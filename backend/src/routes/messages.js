/**
 * Internal messaging, for every signed-in role. Mounted at `/api/messages`.
 *
 *   trader     ↔ their sub-admin, or the super-admin if nobody else owns them
 *   sub-admin  ↔ the super-admin, and ↔ each of their own traders
 *   super-admin ↔ every sub-admin, and ↔ the traders they own directly
 *
 * `threads/me` is the caller's own thread with whoever is above them.
 * `threads/:memberId` is a conversation the caller handles as an admin;
 * anyone else's id 404s, as everywhere in the admin API (docs/roles.md).
 */
import { Router } from 'express';
import {
  findInboxMember,
  hasOwnThread,
  listInbox,
  listThread,
  markRead,
  MAX_MESSAGE_LENGTH,
  searchContacts,
  sendMessage,
  SIDES,
  unreadCounts,
} from '../models/messages.js';
import { ADMIN_ROLES, ROLES, UUID_PATTERN } from '../models/users.js';
import { requireRole } from '../middleware/auth.js';
import { fail, ok } from './respond.js';

const router = Router();

const NOT_FOUND = "We couldn't find this conversation.";

/** A non-negative integer query/body value, or undefined. */
const messageId = (value) => {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 0 ? n : NaN;
};

/**
 * Resolves `:memberId` to `{ memberId, side, member }`, or null when the
 * caller has no such conversation.
 */
async function resolveThread(req) {
  const { memberId } = req.params;
  if (memberId === 'me') {
    return hasOwnThread(req.user.role) ? { memberId: req.user.id, side: SIDES.MEMBER } : null;
  }
  if (!ADMIN_ROLES.includes(req.user.role) || !UUID_PATTERN.test(memberId)) return null;
  const member = await findInboxMember(req.user, memberId);
  return member ? { memberId, side: SIDES.ADMIN, member } : null;
}

/** For the sidebar badge, polled by every shell. */
router.get('/unread', async (req, res) => ok(res, await unreadCounts(req.user)));

/** `?q=&kind=user|sub_admin&limit=&offset=` — the conversations this admin handles. */
router.get('/inbox', requireRole(...ADMIN_ROLES), async (req, res) => {
  const { kind } = req.query;
  if (kind !== undefined && kind !== ROLES.USER && kind !== ROLES.SUB_ADMIN) {
    return fail(res, 400, 'Unknown filter.');
  }
  ok(
    res,
    await listInbox(req.user, {
      q: String(req.query.q ?? '').trim(),
      kind,
      limit: Math.min(Math.max(Number(req.query.limit) || 50, 1), 200),
      offset: Math.max(Number(req.query.offset) || 0, 0),
    })
  );
});

/** `?q=` — people this admin can start a conversation with. */
router.get('/contacts', requireRole(...ADMIN_ROLES), async (req, res) =>
  ok(res, await searchContacts(req.user, { q: String(req.query.q ?? '').trim() }))
);

/** `?after=<id>` for new messages only (polling), `?before=<id>` for an older page. */
router.get('/threads/:memberId', async (req, res) => {
  const thread = await resolveThread(req);
  if (!thread) return fail(res, 404, NOT_FOUND);
  const after = messageId(req.query.after);
  const before = messageId(req.query.before);
  if (Number.isNaN(after) || Number.isNaN(before)) return fail(res, 400, 'Invalid cursor.');

  const page = await listThread(thread.memberId, req.user, thread.side, { after, before });
  ok(res, { ...page, member: thread.member ?? null, side: thread.side });
});

router.post('/threads/:memberId', async (req, res) => {
  const thread = await resolveThread(req);
  if (!thread) return fail(res, 404, NOT_FOUND);
  const body = String(req.body?.body ?? '').trim();
  if (!body) return fail(res, 400, 'Write a message first.');
  if (body.length > MAX_MESSAGE_LENGTH) {
    return fail(res, 400, `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`);
  }
  ok(res, await sendMessage({ memberId: thread.memberId, sender: req.user, side: thread.side, body }), 201);
});

/** `{ upTo }` — the newest message id the caller has on screen. */
router.post('/threads/:memberId/read', async (req, res) => {
  const thread = await resolveThread(req);
  if (!thread) return fail(res, 404, NOT_FOUND);
  const upTo = messageId(req.body?.upTo);
  if (upTo === undefined || Number.isNaN(upTo)) return fail(res, 400, 'Invalid message id.');
  await markRead(thread.memberId, thread.side, upTo);
  ok(res, await unreadCounts(req.user));
});

export default router;
