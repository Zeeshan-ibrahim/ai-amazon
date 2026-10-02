/**
 * Internal messaging. See migrations/014_messages.sql and docs/roles.md.
 *
 * A conversation belongs to a member (trader or sub-admin). Its admin side
 * is whoever owns the member now: a trader's sub-admin, else the
 * super-admin; a sub-admin's own thread is with the super-admin. Every
 * super-admin shares one inbox and one read mark.
 */
import { pool, withTransaction } from '../db/pool.js';
import { displayNameOf, ROLES } from './users.js';

export const MAX_MESSAGE_LENGTH = 2000;
const PAGE_SIZE = 50;

/** The side of a conversation the viewer is on. */
export const SIDES = Object.freeze({ MEMBER: 'member', ADMIN: 'admin' });

/** Roles that have a thread of their own with someone above them. */
export const hasOwnThread = (role) => role === ROLES.USER || role === ROLES.SUB_ADMIN;

/**
 * SQL condition on a users row aliased `u`: a member whose conversations
 * the admin bound at `param` handles.
 */
const inboxScopeSql = (admin, param) =>
  admin.role === ROLES.SUPER_ADMIN
    ? `(u.role = '${ROLES.SUB_ADMIN}' OR (u.role = '${ROLES.USER}' AND u.created_by IS NULL))`
    : `(u.role = '${ROLES.USER}' AND u.created_by = ${param})`;

const handleOf = (row) => row.username || row.email.split('@')[0];

const toContact = (row) => ({
  id: row.id,
  role: row.role,
  status: row.status,
  displayName: displayNameOf(row),
  handle: handleOf(row),
  email: row.email,
});

/**
 * One message as `viewer` sees it. A member never learns which admin wrote
 * to them (docs/roles.md: a user never sees who added them), so the admin
 * side only carries a sender handle in the admin view.
 */
const toMessage = (row, viewer, side) => ({
  id: Number(row.id),
  body: row.body,
  createdAt: row.created_at,
  fromMember: row.from_member,
  mine: side === SIDES.MEMBER ? row.from_member : !row.from_member && row.sender_id === viewer.id,
  sender:
    side === SIDES.ADMIN && !row.from_member
      ? row.sender_username || row.sender_email
        ? { handle: row.sender_username || row.sender_email.split('@')[0], role: row.sender_role }
        : null
      : undefined,
});

/**
 * `{ own, inbox, count }` — unread messages in the viewer's own thread and
 * across the conversations they handle as an admin.
 */
export async function unreadCounts(viewer) {
  const own = hasOwnThread(viewer.role)
    ? (
        await pool.query(
          `SELECT count(*)::int AS n
             FROM messages m JOIN conversations c ON c.member_id = m.member_id
            WHERE c.member_id = $1 AND NOT m.from_member AND m.id > c.member_read_id`,
          [viewer.id]
        )
      ).rows[0].n
    : 0;

  let inbox = 0;
  if (viewer.role !== ROLES.USER) {
    const params = viewer.role === ROLES.SUB_ADMIN ? [viewer.id] : [];
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n
         FROM messages m
         JOIN conversations c ON c.member_id = m.member_id
         JOIN users u ON u.id = c.member_id
        WHERE m.from_member AND m.id > c.admin_read_id AND ${inboxScopeSql(viewer, '$1')}`,
      params
    );
    inbox = rows[0].n;
  }
  return { own, inbox, count: own + inbox };
}

/**
 * The admin's conversations, most recent first. `kind` narrows to traders
 * or sub-admins (only a super-admin has both); `q` matches name, username
 * or email.
 */
export async function listInbox(admin, { q = '', kind, limit = PAGE_SIZE, offset = 0 } = {}) {
  const params = [];
  const where = [];
  if (admin.role === ROLES.SUB_ADMIN) params.push(admin.id);
  where.push(inboxScopeSql(admin, '$1'));
  if (kind) {
    params.push(kind);
    where.push(`u.role = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const p = `$${params.length}`;
    where.push(
      `(u.email ILIKE ${p} OR u.username ILIKE ${p} OR (u.first_name || ' ' || u.last_name) ILIKE ${p})`
    );
  }

  const filter = where.join(' AND ');
  const [{ rows }, { rows: total }] = await Promise.all([
    pool.query(
      `SELECT u.*, c.last_message_at,
              last.body AS last_body, last.from_member AS last_from_member, last.created_at AS last_created_at,
              (SELECT count(*)::int FROM messages m
                WHERE m.member_id = c.member_id AND m.from_member AND m.id > c.admin_read_id) AS unread
         FROM conversations c
         JOIN users u ON u.id = c.member_id
         LEFT JOIN LATERAL (
           SELECT body, from_member, created_at FROM messages m
            WHERE m.member_id = c.member_id ORDER BY m.id DESC LIMIT 1
         ) last ON true
        WHERE ${filter}
        ORDER BY c.last_message_at DESC, u.id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT count(*)::int AS n FROM conversations c JOIN users u ON u.id = c.member_id WHERE ${filter}`,
      params
    ),
  ]);

  return {
    items: rows.map((row) => ({
      member: toContact(row),
      unread: row.unread,
      lastMessageAt: row.last_message_at,
      lastMessage: row.last_created_at
        ? { body: row.last_body, fromMember: row.last_from_member, createdAt: row.last_created_at }
        : null,
    })),
    total: total[0].n,
  };
}

/** Members this admin can start a conversation with, for the "New message" picker. */
export async function searchContacts(admin, { q = '', limit = 20 } = {}) {
  const params = admin.role === ROLES.SUB_ADMIN ? [admin.id] : [];
  let match = '';
  if (q) {
    params.push(`%${q}%`);
    const p = `$${params.length}`;
    match = `AND (u.email ILIKE ${p} OR u.username ILIKE ${p} OR (u.first_name || ' ' || u.last_name) ILIKE ${p})`;
  }
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT u.* FROM users u
      WHERE ${inboxScopeSql(admin, '$1')} ${match}
      ORDER BY u.role DESC, lower(coalesce(nullif(u.username, ''), u.email))
      LIMIT $${params.length}`,
    params
  );
  return rows.map(toContact);
}

/** The member row if `admin` handles their conversation, else null. */
export async function findInboxMember(admin, memberId) {
  const params = [memberId];
  if (admin.role === ROLES.SUB_ADMIN) params.push(admin.id);
  const { rows } = await pool.query(
    `SELECT u.* FROM users u WHERE u.id = $1 AND ${inboxScopeSql(admin, '$2')}`,
    params
  );
  return rows[0] ? toContact(rows[0]) : null;
}

/**
 * A page of one conversation, oldest first. `after` returns only newer
 * messages (polling); `before` an older page (scrolling back). With neither,
 * the latest page. `otherReadId` is the other side's read mark, for "Seen".
 */
export async function listThread(memberId, viewer, side, { after, before } = {}) {
  const params = [memberId];
  let cursor = '';
  let order = 'DESC';
  if (after !== undefined) {
    params.push(after);
    cursor = `AND m.id > $${params.length}`;
    order = 'ASC';
  } else if (before !== undefined) {
    params.push(before);
    cursor = `AND m.id < $${params.length}`;
  }
  params.push(PAGE_SIZE + 1);

  const [{ rows }, { rows: conv }] = await Promise.all([
    pool.query(
      `SELECT m.*, s.username AS sender_username, s.email AS sender_email, s.role AS sender_role
         FROM messages m LEFT JOIN users s ON s.id = m.sender_id
        WHERE m.member_id = $1 ${cursor}
        ORDER BY m.id ${order}
        LIMIT $${params.length}`,
      params
    ),
    pool.query('SELECT member_read_id, admin_read_id FROM conversations WHERE member_id = $1', [memberId]),
  ]);

  const more = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);
  if (order === 'DESC') page.reverse();
  const readIds = conv[0] ?? { member_read_id: 0, admin_read_id: 0 };

  return {
    messages: page.map((row) => toMessage(row, viewer, side)),
    // Polling with `after` never pages; the caller just asks again.
    hasOlder: after === undefined && more,
    otherReadId: Number(side === SIDES.MEMBER ? readIds.admin_read_id : readIds.member_read_id),
  };
}

/**
 * Adds a message, opening the conversation on the first one. The sender's
 * side is marked read up to it, since they've obviously seen it.
 */
export function sendMessage({ memberId, sender, side, body }) {
  const fromMember = side === SIDES.MEMBER;
  const readColumn = fromMember ? 'member_read_id' : 'admin_read_id';
  return withTransaction(async (db) => {
    await db.query('INSERT INTO conversations (member_id) VALUES ($1) ON CONFLICT DO NOTHING', [memberId]);
    const { rows } = await db.query(
      `INSERT INTO messages (member_id, sender_id, from_member, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [memberId, sender.id, fromMember, body]
    );
    const message = rows[0];
    await db.query(
      `UPDATE conversations SET last_message_at = $2, ${readColumn} = GREATEST(${readColumn}, $3)
        WHERE member_id = $1`,
      [memberId, message.created_at, message.id]
    );
    return toMessage(
      { ...message, sender_username: sender.username, sender_email: sender.loginEmail, sender_role: sender.role },
      sender,
      side
    );
  });
}

/**
 * Moves `side`'s read mark up to `upTo` — the newest message the viewer has
 * on screen — never past the newest message that exists, and never back.
 */
export async function markRead(memberId, side, upTo) {
  const column = side === SIDES.MEMBER ? 'member_read_id' : 'admin_read_id';
  await pool.query(
    `UPDATE conversations
        SET ${column} = GREATEST(${column},
              LEAST($2::bigint, (SELECT COALESCE(max(id), 0) FROM messages WHERE member_id = $1)))
      WHERE member_id = $1`,
    [memberId, upTo]
  );
}
