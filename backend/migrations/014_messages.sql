-- Internal messaging (docs/roles.md → Messages).
--
-- One conversation per member: a trader, or a sub-admin. The other side is
-- whoever owns that member right now — a trader's sub-admin (`created_by`),
-- else the super-admin; a sub-admin always talks to the super-admin. The
-- admin side isn't stored, so a reassigned trader's thread moves with them.
--
-- Read state is a high-water mark per side: the last message id each side
-- has seen. Unread = the other side's messages above that id.

CREATE TABLE conversations (
  member_id       UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  member_read_id  BIGINT NOT NULL DEFAULT 0,
  admin_read_id   BIGINT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id          BIGSERIAL PRIMARY KEY,
  member_id   UUID NOT NULL REFERENCES conversations (member_id) ON DELETE CASCADE,
  -- Who wrote it. Kept for the admin side, where several super-admins share
  -- one inbox; NULL once that account is deleted.
  sender_id   UUID REFERENCES users (id) ON DELETE SET NULL,
  -- True when the member wrote it, false when the admin side did.
  from_member BOOLEAN NOT NULL,
  body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_member_id_idx ON messages (member_id, id);
CREATE INDEX conversations_last_message_at_idx ON conversations (last_message_at DESC);
