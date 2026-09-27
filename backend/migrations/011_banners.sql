-- Promotional banners, managed from the admin Banners section and shown on
-- the trader's dashboard. Nothing references a banner, so deletes are real.

CREATE TABLE banners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  image_url    TEXT,
  -- Pre-filled message when a trader taps the banner to open the Telegram
  -- support chat.
  support_note TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX banners_created_idx ON banners (created_at DESC);

CREATE TRIGGER banners_set_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
