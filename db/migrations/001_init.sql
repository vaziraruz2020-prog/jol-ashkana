CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  currency TEXT NOT NULL,
  currency_label_ru TEXT NOT NULL,
  currency_label_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  country_id TEXT NOT NULL REFERENCES countries(id),
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id),
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'ru' CHECK (locale IN ('ru', 'en')),
  country_id TEXT REFERENCES countries(id),
  city_id TEXT REFERENCES cities(id),
  district_id TEXT REFERENCES districts(id),
  active_role TEXT NOT NULL DEFAULT 'buyer' CHECK (active_role IN ('buyer', 'baker')),
  is_support BOOLEAN NOT NULL DEFAULT FALSE,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT DEFAULT '',
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kitchens (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  owner_full_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  country_id TEXT NOT NULL REFERENCES countries(id),
  city_id TEXT NOT NULL REFERENCES cities(id),
  district_id TEXT NOT NULL REFERENCES districts(id),
  cutoff_hour INTEGER NOT NULL DEFAULT 18,
  delivery_pickup BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_courier BOOLEAN NOT NULL DEFAULT TRUE,
  emoji TEXT DEFAULT '🍞',
  accent TEXT DEFAULT '#E85D04',
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_note TEXT DEFAULT '',
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_cooks_here BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS kitchens_owner_user_id_uidx ON kitchens (owner_user_id);

CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  unit TEXT DEFAULT 'шт',
  ingredients TEXT DEFAULT '',
  leftover INTEGER NOT NULL DEFAULT 20 CHECK (leftover >= 0),
  default_leftover INTEGER NOT NULL DEFAULT 20 CHECK (default_leftover >= 0),
  available_tomorrow BOOLEAN NOT NULL DEFAULT TRUE,
  emoji TEXT DEFAULT '🍽',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL REFERENCES users(id),
  kitchen_id TEXT NOT NULL REFERENCES kitchens(id),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('pickup', 'courier')),
  slot TEXT NOT NULL,
  address TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  pay_method TEXT NOT NULL DEFAULT 'cash' CHECK (pay_method IN ('cash', 'card')),
  pay_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (pay_status IN ('unpaid', 'pending', 'paid', 'refunded')),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'baking', 'ready', 'delivered', 'cancelled')),
  for_date DATE NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id TEXT NOT NULL,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price INTEGER NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_user_id TEXT,
  from_status TEXT,
  to_status TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'working', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
