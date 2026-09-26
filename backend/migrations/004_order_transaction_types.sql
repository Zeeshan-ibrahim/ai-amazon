-- Ledger types for order settlement. Postgres won't use a new enum value in
-- the transaction that adds it, so the columns and constraint that reference
-- these live in 005.
--   order_purchase → debit of the order price when the trader purchases
--   order_sale     → credit of price + profit when the trader sells

ALTER TYPE transaction_type ADD VALUE 'order_purchase';
ALTER TYPE transaction_type ADD VALUE 'order_sale';
