CREATE SEQUENCE IF NOT EXISTS enquiry_reference_seq;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  reference VARCHAR(40) NOT NULL UNIQUE DEFAULT (
    'MMH-' ||
    TO_CHAR(NOW(), 'YYYY') ||
    '-' ||
    LPAD(NEXTVAL('enquiry_reference_seq')::TEXT, 6, '0')
  ),

  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Snapshots preserve the original enquiry details
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_location TEXT,

  customer_note TEXT,
  language VARCHAR(5) NOT NULL DEFAULT 'hi',

  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'quoted', 'converted', 'cancelled')),

  source VARCHAR(30) NOT NULL DEFAULT 'whatsapp_click',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  enquiry_id UUID NOT NULL
    REFERENCES enquiries(id) ON DELETE CASCADE,

  product_id TEXT,
  product_slug TEXT,
  product_name TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  variant_label TEXT,

  attributes JSONB NOT NULL DEFAULT '{}'::JSONB,

  price NUMERIC(12, 2),
  price_status TEXT,
  availability TEXT,

  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'piece',

  notes TEXT,
  image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_created_at
  ON enquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enquiries_status
  ON enquiries(status);

CREATE INDEX IF NOT EXISTS idx_enquiry_items_enquiry_id
  ON enquiry_items(enquiry_id);

CREATE INDEX IF NOT EXISTS idx_enquiry_items_product_id
  ON enquiry_items(product_id);