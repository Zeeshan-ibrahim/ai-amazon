-- Ledger type for a rejected plan request. As in 004/007, the constraint that
-- uses the new value lives in the next migration.
--   plan_refund → credit of the plan price back when an admin rejects the request

ALTER TYPE transaction_type ADD VALUE 'plan_refund';
