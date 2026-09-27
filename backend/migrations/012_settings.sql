-- Group-wide settings from the admin Wallets & Support screen. A single row,
-- enforced by the `id` check.

CREATE TABLE settings (
  id                      BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  -- Where traders reach support, e.g. https://t.me/group_support. Banners
  -- open it with their support note pre-filled.
  telegram_support_url    TEXT,
  -- Max per withdrawal for members without their own `users.withdrawal_limit`.
  -- 0 means no limit.
  global_withdrawal_limit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (global_withdrawal_limit >= 0),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings DEFAULT VALUES;

CREATE TRIGGER settings_set_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
