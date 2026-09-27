-- Super-admins and sub-admins (docs/roles.md).
--
--   super_admin → what `admin` was: sees and manages everything
--   sub_admin   → admin portal, scoped to the records they created
--
-- `created_by` is the sub-admin who owns a row. NULL means the super-admin
-- owns it: users from public signup or made by a super-admin, and the
-- shared product catalog. Deleting a sub-admin hands their rows back to the
-- super-admin through ON DELETE SET NULL.
--
-- The new enum value can't be used in the transaction that adds it, so
-- nothing below refers to 'sub_admin'.

ALTER TYPE user_role RENAME VALUE 'admin' TO 'super_admin';
ALTER TYPE user_role ADD VALUE 'sub_admin';

ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE plans ADD COLUMN created_by UUID REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN created_by UUID REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX users_created_by_idx ON users (created_by);
CREATE INDEX plans_created_by_idx ON plans (created_by);
CREATE INDEX products_created_by_idx ON products (created_by);
