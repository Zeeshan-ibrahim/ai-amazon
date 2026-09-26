-- Members admin: invite codes, withdrawal limits, the product catalog,
-- per-user order assignments, the money ledger and the audit trail.

/* ------------------------------------------------------------- users */

-- 6-character member code (e.g. WSKZ8H), shown as "Invitation ID" / "Audit ref".
CREATE FUNCTION gen_invite_code() RETURNS text AS $$
DECLARE
  alphabet CONSTANT text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code text;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(alphabet, 1 + floor(random() * 36)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;

ALTER TABLE users ADD COLUMN invite_code TEXT;
UPDATE users SET invite_code = gen_invite_code();
ALTER TABLE users
  ALTER COLUMN invite_code SET NOT NULL,
  ALTER COLUMN invite_code SET DEFAULT gen_invite_code();
CREATE UNIQUE INDEX users_invite_code_key ON users (invite_code);

-- Maximum amount per withdrawal request. 0 means no limit.
ALTER TABLE users
  ADD COLUMN withdrawal_limit NUMERIC(14, 2) NOT NULL DEFAULT 0
  CHECK (withdrawal_limit >= 0);

/* ---------------------------------------------------------- products */

-- The catalog admins assign from ("Available contracts").
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  image_url         TEXT,
  price             NUMERIC(14, 2) NOT NULL CHECK (price > 0),
  profit_percentage NUMERIC(6, 3) NOT NULL DEFAULT 0 CHECK (profit_percentage >= 0),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_price_idx ON products (price) WHERE is_active;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

/* ------------------------------------------------------------ orders */

-- A product assigned to one member. Price and profit are copied at
-- assignment so later catalog edits don't change open orders.
--   assigned  → trader's "Purchase" tab
--   purchased → trader's "Sell" tab
--   completed → trader's "Completed" tab
CREATE TYPE order_status AS ENUM ('assigned', 'purchased', 'completed');

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products (id),
  price             NUMERIC(14, 2) NOT NULL CHECK (price > 0),
  profit_percentage NUMERIC(6, 3) NOT NULL CHECK (profit_percentage >= 0),
  status            order_status NOT NULL DEFAULT 'assigned',
  assigned_by       UUID REFERENCES users (id) ON DELETE SET NULL,
  assigned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  purchased_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);

-- A product can't be open twice for the same member.
CREATE UNIQUE INDEX orders_one_open_per_product
  ON orders (user_id, product_id) WHERE status <> 'completed';
CREATE INDEX orders_user_idx ON orders (user_id, assigned_at DESC);

/* ------------------------------------------------------ transactions */

-- Every balance movement. Deposits and withdrawals start `pending` and only
-- move the balance when an admin approves them; adjustments are admin-made
-- and approved on creation. Amounts are always positive — `direction` says
-- which way the money went.
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'adjustment');
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transaction_direction AS ENUM ('credit', 'debit');

CREATE TABLE transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type         transaction_type NOT NULL,
  direction    transaction_direction NOT NULL,
  amount       NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  status       transaction_status NOT NULL DEFAULT 'pending',
  asset        TEXT,
  address      TEXT,
  receipt_name TEXT,
  note         TEXT,
  reviewed_by  UUID REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT transactions_direction_matches_type CHECK (
    (type = 'deposit' AND direction = 'credit')
    OR (type = 'withdrawal' AND direction = 'debit')
    OR type = 'adjustment'
  )
);

CREATE INDEX transactions_user_idx ON transactions (user_id, created_at DESC);
CREATE INDEX transactions_pending_idx ON transactions (created_at) WHERE status = 'pending';

/* -------------------------------------------------------- audit_logs */

-- Append-only record of who did what to which member.
CREATE TABLE audit_logs (
  id             BIGSERIAL PRIMARY KEY,
  actor_id       UUID REFERENCES users (id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users (id) ON DELETE CASCADE,
  action         TEXT NOT NULL,
  details        JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_target_idx ON audit_logs (target_user_id, created_at DESC);
