-- Admin-managed investment plans and the contracts traders activate from them.
-- The new ledger type can't be used in the transaction that adds it, so the
-- column and constraint that reference it live in 008.
--   plan_activation → debit of the plan price when the trader activates it

ALTER TYPE transaction_type ADD VALUE 'plan_activation';

/* -------------------------------------------------------------- plans */

-- Shown to traders on /plans. Deleting a plan from the admin panel sets
-- `is_active = false`, since contracts keep a reference to it.
CREATE TABLE plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  tag         TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price       NUMERIC(14, 2) NOT NULL CHECK (price > 0),
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX plans_active_price_idx ON plans (price) WHERE is_active;

CREATE TRIGGER plans_set_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

/* ----------------------------------------------------- plan_contracts */

-- A trader's activation of a plan. The price is copied and debited at
-- activation, so later plan edits don't change it.
--   pending  → awaiting admin review (Plan Requests)
--   active   → approved
--   rejected → declined
CREATE TYPE plan_contract_status AS ENUM ('pending', 'active', 'rejected');

CREATE TABLE plan_contracts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES plans (id),
  price       NUMERIC(14, 2) NOT NULL CHECK (price > 0),
  status      plan_contract_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One pending request per plan per member, so a double submit can't debit twice.
CREATE UNIQUE INDEX plan_contracts_one_pending_per_plan
  ON plan_contracts (user_id, plan_id) WHERE status = 'pending';
CREATE INDEX plan_contracts_user_idx ON plan_contracts (user_id, created_at DESC);
CREATE INDEX plan_contracts_pending_idx ON plan_contracts (created_at) WHERE status = 'pending';
