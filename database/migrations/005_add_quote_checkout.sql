ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS quote_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS quote_reply TEXT,
  ADD COLUMN IF NOT EXISTS quote_token UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enquiries_quote_token ON enquiries(quote_token);
