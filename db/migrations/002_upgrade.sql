-- Patch databases created by the old CREATE TABLE IF NOT EXISTS path.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE kitchens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE dishes ADD COLUMN IF NOT EXISTS default_leftover INTEGER DEFAULT 20;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_status TEXT DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  actor_user_id TEXT,
  from_status TEXT,
  to_status TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS kitchens_district_visible_idx ON kitchens (district_id, verification_status, hidden);
CREATE INDEX IF NOT EXISTS dishes_kitchen_id_idx ON dishes (kitchen_id);
CREATE INDEX IF NOT EXISTS orders_buyer_created_idx ON orders (buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_kitchen_status_idx ON orders (kitchen_id, status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS tickets_status_created_idx ON tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events (order_id, created_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_support' AND data_type = 'integer'
  ) THEN
    ALTER TABLE users ALTER COLUMN is_support DROP DEFAULT;
    ALTER TABLE users ALTER COLUMN is_support TYPE boolean USING (is_support <> 0);
    ALTER TABLE users ALTER COLUMN is_support SET DEFAULT FALSE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'blocked' AND data_type = 'integer'
  ) THEN
    ALTER TABLE users ALTER COLUMN blocked DROP DEFAULT;
    ALTER TABLE users ALTER COLUMN blocked TYPE boolean USING (blocked <> 0);
    ALTER TABLE users ALTER COLUMN blocked SET DEFAULT FALSE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kitchens' AND column_name = 'delivery_pickup' AND data_type = 'integer'
  ) THEN
    ALTER TABLE kitchens ALTER COLUMN delivery_pickup DROP DEFAULT;
    ALTER TABLE kitchens ALTER COLUMN delivery_pickup TYPE boolean USING (delivery_pickup <> 0);
    ALTER TABLE kitchens ALTER COLUMN delivery_pickup SET DEFAULT TRUE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kitchens' AND column_name = 'delivery_courier' AND data_type = 'integer'
  ) THEN
    ALTER TABLE kitchens ALTER COLUMN delivery_courier DROP DEFAULT;
    ALTER TABLE kitchens ALTER COLUMN delivery_courier TYPE boolean USING (delivery_courier <> 0);
    ALTER TABLE kitchens ALTER COLUMN delivery_courier SET DEFAULT TRUE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kitchens' AND column_name = 'hidden' AND data_type = 'integer'
  ) THEN
    ALTER TABLE kitchens ALTER COLUMN hidden DROP DEFAULT;
    ALTER TABLE kitchens ALTER COLUMN hidden TYPE boolean USING (hidden <> 0);
    ALTER TABLE kitchens ALTER COLUMN hidden SET DEFAULT FALSE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kitchens' AND column_name = 'confirm_cooks_here' AND data_type = 'integer'
  ) THEN
    ALTER TABLE kitchens ALTER COLUMN confirm_cooks_here DROP DEFAULT;
    ALTER TABLE kitchens ALTER COLUMN confirm_cooks_here TYPE boolean USING (confirm_cooks_here <> 0);
    ALTER TABLE kitchens ALTER COLUMN confirm_cooks_here SET DEFAULT FALSE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dishes' AND column_name = 'available_tomorrow' AND data_type = 'integer'
  ) THEN
    ALTER TABLE dishes ALTER COLUMN available_tomorrow DROP DEFAULT;
    ALTER TABLE dishes ALTER COLUMN available_tomorrow TYPE boolean USING (available_tomorrow <> 0);
    ALTER TABLE dishes ALTER COLUMN available_tomorrow SET DEFAULT TRUE;
  END IF;
END $$;
