-- Links settlement rows to the order that caused them. Settlements are
-- system-made and recorded as `approved` on creation.

ALTER TABLE transactions
  ADD COLUMN order_id UUID REFERENCES orders (id) ON DELETE SET NULL;

-- An order is settled at most once each way.
CREATE UNIQUE INDEX transactions_order_settlement_key
  ON transactions (order_id, type) WHERE order_id IS NOT NULL;

ALTER TABLE transactions
  DROP CONSTRAINT transactions_direction_matches_type,
  ADD CONSTRAINT transactions_direction_matches_type CHECK (
    (type = 'deposit' AND direction = 'credit')
    OR (type = 'withdrawal' AND direction = 'debit')
    OR (type = 'order_purchase' AND direction = 'debit' AND order_id IS NOT NULL)
    OR (type = 'order_sale' AND direction = 'credit' AND order_id IS NOT NULL)
    OR type = 'adjustment'
  );
