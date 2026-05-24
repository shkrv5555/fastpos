-- FastPOS Database Schema — Production
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ENUM tipləri ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role       AS ENUM ('owner', 'employee');    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE product_segment AS ENUM ('simple', 'fast', 'premium'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE discount_type   AS ENUM ('percentage', 'fixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE order_status    AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE payment_type    AS ENUM ('cash', 'card');        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE request_status  AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── İstifadəçilər ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  UNIQUE,
  hr_code       VARCHAR(20)  UNIQUE,
  password_hash TEXT         NOT NULL,
  role          user_role    NOT NULL DEFAULT 'employee',
  is_blocked    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT owner_has_username   CHECK (role != 'owner'    OR username IS NOT NULL),
  CONSTRAINT employee_has_hrcode  CHECK (role != 'employee' OR hr_code  IS NOT NULL)
);

-- ─── Kateqoriyalar ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(80)  NOT NULL UNIQUE,
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ─── İnqredientlər ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingredients (
  id    SERIAL       PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE,
  unit  VARCHAR(20)  NOT NULL DEFAULT 'q'
);

-- ─── Məhsullar ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   INT             REFERENCES categories(id) ON DELETE SET NULL,
  name          VARCHAR(120)    NOT NULL,
  description   TEXT,
  image_url     TEXT,
  base_price    NUMERIC(10,2)   NOT NULL CHECK (base_price >= 0),
  segment       product_segment NOT NULL DEFAULT 'simple',
  stock_qty     INT             NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  is_available  BOOLEAN         NOT NULL DEFAULT TRUE,
  sort_order    INT             NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_segment   ON products(segment);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- ─── Məhsul ↔ İnqredient ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id    UUID REFERENCES products(id)     ON DELETE CASCADE,
  ingredient_id INT  REFERENCES ingredients(id)  ON DELETE CASCADE,
  quantity      NUMERIC(8,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, ingredient_id)
);

-- ─── Endirimlər ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS discounts (
  id             SERIAL        PRIMARY KEY,
  product_id     UUID          REFERENCES products(id) ON DELETE CASCADE,
  discount_type  discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(6,2)  NOT NULL CHECK (discount_value > 0),
  starts_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ends_at        TIMESTAMPTZ,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_percentage CHECK (discount_type != 'percentage' OR discount_value <= 100)
);

CREATE INDEX IF NOT EXISTS idx_discounts_product ON discounts(product_id);
CREATE INDEX IF NOT EXISTS idx_discounts_active  ON discounts(is_active, starts_at, ends_at);

-- ─── Sifariş nömrəsi üçün sequence (ORDERS-DAN ƏVVƏL yaradılmalıdır) ──────────

CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- ─── Sifarişlər ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    VARCHAR(20)  NOT NULL UNIQUE,
  session_id      VARCHAR(80),
  status          order_status NOT NULL DEFAULT 'pending',
  payment_type    payment_type,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  employee_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Sifariş nömrəsini trigger ilə qur (DEFAULT expression sequence-i əvvəlcədən tələb edir)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_number ON orders;
CREATE TRIGGER trg_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_date    ON orders(DATE(created_at));

-- ─── Sifariş məhsulları ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id             SERIAL        PRIMARY KEY,
  order_id       UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name   VARCHAR(120)  NOT NULL,
  quantity       INT           NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL,
  discount_price NUMERIC(10,2),
  subtotal       NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ─── Stok daxiletmə qeydləri ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_intakes (
  id          SERIAL        PRIMARY KEY,
  employee_id UUID          NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  product_id  UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT           NOT NULL CHECK (quantity > 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_intakes_product ON stock_intakes(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_intakes_date    ON stock_intakes(created_at DESC);

-- ─── Redaktə icazəsi sorğuları ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS edit_requests (
  id                SERIAL         PRIMARY KEY,
  employee_id       UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  requested_changes JSONB          NOT NULL,
  comment           TEXT           NOT NULL,
  status            request_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID           REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edit_requests_status  ON edit_requests(status);
CREATE INDEX IF NOT EXISTS idx_edit_requests_employee ON edit_requests(employee_id);

-- ─── Bildirişlər ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id             SERIAL        PRIMARY KEY,
  recipient_id   UUID          REFERENCES users(id) ON DELETE CASCADE,
  recipient_role user_role,
  type           VARCHAR(50)   NOT NULL,
  title          VARCHAR(150)  NOT NULL,
  message        TEXT          NOT NULL,
  data           JSONB,
  is_read        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_role      ON notifications(recipient_role, is_read);

-- ─── VIEW-lər ─────────────────────────────────────────────────────────────────

-- Aktiv endirim qiyməti ilə məhsullar
CREATE OR REPLACE VIEW products_with_discount AS
SELECT
  p.*,
  d.id              AS discount_id,
  d.discount_type,
  d.discount_value,
  CASE
    WHEN d.discount_type = 'percentage' THEN ROUND(p.base_price * (1 - d.discount_value / 100), 2)
    WHEN d.discount_type = 'fixed'      THEN GREATEST(0, p.base_price - d.discount_value)
    ELSE p.base_price
  END               AS final_price
FROM products p
LEFT JOIN LATERAL (
  SELECT * FROM discounts
  WHERE product_id = p.id
    AND is_active  = TRUE
    AND starts_at <= NOW()
    AND (ends_at IS NULL OR ends_at > NOW())
  ORDER BY created_at DESC
  LIMIT 1
) d ON TRUE;

-- Ən çox satılan məhsullar
CREATE OR REPLACE VIEW top_selling_products AS
SELECT
  oi.product_id,
  oi.product_name,
  SUM(oi.quantity)            AS total_sold,
  SUM(oi.subtotal)            AS total_revenue,
  COUNT(DISTINCT oi.order_id) AS order_count
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_sold DESC;

-- ─── Trigger-lər ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
