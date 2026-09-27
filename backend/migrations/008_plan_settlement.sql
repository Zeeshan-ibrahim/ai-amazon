-- Links plan activation debits to the contract that caused them. Recorded as
-- `approved` on creation, like order settlements.

ALTER TABLE transactions
  ADD COLUMN plan_contract_id UUID REFERENCES plan_contracts (id) ON DELETE SET NULL;

-- A contract is debited at most once.
CREATE UNIQUE INDEX transactions_plan_contract_key
  ON transactions (plan_contract_id, type) WHERE plan_contract_id IS NOT NULL;

ALTER TABLE transactions
  DROP CONSTRAINT transactions_direction_matches_type,
  ADD CONSTRAINT transactions_direction_matches_type CHECK (
    (type = 'deposit' AND direction = 'credit')
    OR (type = 'withdrawal' AND direction = 'debit')
    OR (type = 'order_purchase' AND direction = 'debit' AND order_id IS NOT NULL)
    OR (type = 'order_sale' AND direction = 'credit' AND order_id IS NOT NULL)
    OR (type = 'plan_activation' AND direction = 'debit' AND plan_contract_id IS NOT NULL)
    OR type = 'adjustment'
  );
