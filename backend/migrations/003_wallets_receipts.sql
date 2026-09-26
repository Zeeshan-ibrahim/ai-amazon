-- Company deposit wallets and receipt uploads for the Financials review queue.

/* ------------------------------------------------------------ wallets */

-- Corporate addresses traders pay into. Several per coin/network are allowed.
-- Managed from the admin Wallets section.
CREATE TABLE wallets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coin       TEXT NOT NULL,
  network    TEXT NOT NULL,
  address    TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX wallets_network_address_key ON wallets (network, address);

CREATE TRIGGER wallets_set_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

/* ------------------------------------------------------- transactions */

-- `coin`/`network` replace the free-text `asset`. `address` means:
--   deposit    → the company wallet the trader paid into (copied from `wallet_id`
--                so edits to the wallet don't rewrite history)
--   withdrawal → the trader's destination address
-- `receipt_path` is the stored upload's file name under UPLOAD_DIR/receipts.
ALTER TABLE transactions
  ADD COLUMN coin TEXT,
  ADD COLUMN network TEXT,
  ADD COLUMN wallet_id UUID REFERENCES wallets (id) ON DELETE SET NULL,
  ADD COLUMN receipt_path TEXT;

UPDATE transactions
   SET coin = split_part(asset, ' ', 1),
       network = NULLIF(split_part(asset, ' ', 2), '')
 WHERE asset IS NOT NULL;

ALTER TABLE transactions DROP COLUMN asset;

-- The Financials queue: by type and status, newest first.
CREATE INDEX transactions_review_idx ON transactions (type, status, created_at DESC);
