-- Synthetic demo data for the catalog tools.
CREATE TABLE products (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0)
);
INSERT INTO products (sku, name, category, price_cents, stock) VALUES
  ('BK-001', 'Field Guide to Birds', 'books', 2499, 12),
  ('BK-002', 'Pocket Atlas', 'books', 1299, 40),
  ('GD-001', 'Trowel', 'garden', 899, 7),
  ('GD-002', 'Watering Can', 'garden', 1999, 0);
