-- A rejected plan request refunds its activation debit, linked by
-- `plan_contract_id`. `transactions_plan_contract_key` (008) already allows
-- one row per contract per type, so a contract is refunded at most once.

ALTER TABLE transactions
  DROP CONSTRAINT transactions_direction_matches_type,
  ADD CONSTRAINT transactions_direction_matches_type CHECK (
    (type = 'deposit' AND direction = 'credit')
    OR (type = 'withdrawal' AND direction = 'debit')
    OR (type = 'order_purchase' AND direction = 'debit' AND order_id IS NOT NULL)
    OR (type = 'order_sale' AND direction = 'credit' AND order_id IS NOT NULL)
    OR (type = 'plan_activation' AND direction = 'debit' AND plan_contract_id IS NOT NULL)
    OR (type = 'plan_refund' AND direction = 'credit' AND plan_contract_id IS NOT NULL)
    OR type = 'adjustment'
  );
