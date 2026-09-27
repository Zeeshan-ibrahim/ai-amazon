-- Admin-managed product details. Deleting a product from the admin panel
-- sets `is_active = false` instead, since orders keep a reference to it.

ALTER TABLE products
  ADD COLUMN description TEXT NOT NULL DEFAULT '';

CREATE INDEX products_active_created_idx ON products (created_at DESC) WHERE is_active;
