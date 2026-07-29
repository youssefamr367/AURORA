CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('New', 'manufacturing', 'Done', 'finished');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  name text NOT NULL,
  number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_number_11_digits CHECK (number ~ '^[0-9]{11}$')
);

CREATE TABLE IF NOT EXISTS fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eshra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paintings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marbles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS glass (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  product_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  images text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_supplier_id_idx ON products(supplier_id);

CREATE TABLE IF NOT EXISTS product_fabrics (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  fabric_id uuid NOT NULL REFERENCES fabrics(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, fabric_id)
);

CREATE TABLE IF NOT EXISTS product_eshra (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  eshra_id uuid NOT NULL REFERENCES eshra(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, eshra_id)
);

CREATE TABLE IF NOT EXISTS product_paintings (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  painting_id uuid NOT NULL REFERENCES paintings(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, painting_id)
);

CREATE TABLE IF NOT EXISTS product_marbles (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  marble_id uuid NOT NULL REFERENCES marbles(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, marble_id)
);

CREATE TABLE IF NOT EXISTS product_glass (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  glass_id uuid NOT NULL REFERENCES glass(id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, glass_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mongo_id text UNIQUE,
  order_id integer NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT order_items_quantity_positive CHECK (quantity >= 1)
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);
CREATE INDEX IF NOT EXISTS order_items_supplier_id_idx ON order_items(supplier_id);

CREATE TABLE IF NOT EXISTS order_item_fabrics (
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  fabric_id uuid NOT NULL REFERENCES fabrics(id) ON DELETE RESTRICT,
  PRIMARY KEY (order_item_id, fabric_id)
);

CREATE TABLE IF NOT EXISTS order_item_eshra (
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  eshra_id uuid NOT NULL REFERENCES eshra(id) ON DELETE RESTRICT,
  PRIMARY KEY (order_item_id, eshra_id)
);

CREATE TABLE IF NOT EXISTS order_item_paintings (
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  painting_id uuid NOT NULL REFERENCES paintings(id) ON DELETE RESTRICT,
  PRIMARY KEY (order_item_id, painting_id)
);

CREATE TABLE IF NOT EXISTS order_item_marbles (
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  marble_id uuid NOT NULL REFERENCES marbles(id) ON DELETE RESTRICT,
  PRIMARY KEY (order_item_id, marble_id)
);

CREATE TABLE IF NOT EXISTS order_item_glass (
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  glass_id uuid NOT NULL REFERENCES glass(id) ON DELETE RESTRICT,
  PRIMARY KEY (order_item_id, glass_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_date_idx
  ON order_status_history(order_id, date DESC);

CREATE INDEX IF NOT EXISTS order_status_history_order_status_date_idx
  ON order_status_history(order_id, status, date DESC);

CREATE TABLE IF NOT EXISTS order_status_sla (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  due_date timestamptz,
  green_date date,
  orange_date date,
  red_date date,
  PRIMARY KEY (order_id, status),
  CONSTRAINT order_status_sla_date_order CHECK (
    (green_date IS NULL AND orange_date IS NULL AND red_date IS NULL)
    OR (
      green_date IS NOT NULL
      AND orange_date IS NOT NULL
      AND red_date IS NOT NULL
      AND green_date < orange_date
      AND orange_date < red_date
    )
  )
);
