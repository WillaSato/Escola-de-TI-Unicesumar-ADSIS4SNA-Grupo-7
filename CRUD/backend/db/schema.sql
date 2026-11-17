BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS products (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(90) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 90),
  name_key text NOT NULL,
  category text NOT NULL CHECK (category IN ('Eletrônicos', 'Eletrodomésticos', 'Casa', 'Outros')),
  purchase_date date NOT NULL,
  warranty_until date,
  archived_at timestamptz,
  CHECK (warranty_until IS NULL OR warranty_until >= purchase_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS products_active_duplicate ON products (owner_id, name_key, category, purchase_date) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS products_by_owner ON products (owner_id, (archived_at IS NOT NULL), purchase_date DESC, id DESC);

COMMIT;
