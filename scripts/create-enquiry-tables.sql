CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT NOT NULL,
  delivery_location TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  customer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiry_items (
  id SERIAL PRIMARY KEY,
  enquiry_id INTEGER NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  variant_label TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  price NUMERIC,
  price_status TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);
