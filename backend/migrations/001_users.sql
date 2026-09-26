-- Users and roles.
--
-- `role` decides which app a person gets: `user` sees the trading dashboard,
-- `admin` sees the admin panel. Signup can only ever create `user` rows;
-- admins are created with `npm run db:create-admin`.

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended');

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Credentials. `email` is the login email and is stored lowercased.
  email               TEXT NOT NULL,
  password_hash       TEXT NOT NULL,
  withdrawal_pin_hash TEXT,

  role                user_role NOT NULL DEFAULT 'user',
  status              user_status NOT NULL DEFAULT 'active',

  -- Profile.
  username            TEXT,
  first_name          TEXT NOT NULL DEFAULT '',
  last_name           TEXT NOT NULL DEFAULT '',
  contact_email       TEXT,
  phone               TEXT NOT NULL DEFAULT '',
  avatar_url          TEXT,
  language            TEXT NOT NULL DEFAULT 'en',

  balance             NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),

  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT users_email_lowercase CHECK (email = lower(email))
);

CREATE UNIQUE INDEX users_email_key ON users (email);
CREATE UNIQUE INDEX users_username_key ON users (lower(username));
CREATE INDEX users_role_idx ON users (role);

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
