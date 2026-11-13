-- Quote payments: YOUPI-PG manual-UPI checkout for approved quotations.
--
-- Flow: an admin approves a quotation (enquiries.status = 'quoted'), the customer
-- opens /quote/:token and pays the approved amount through the YOUPI checkout.
-- YOUPI collects the customer's UPI reference (UTR) and sends a signed
-- MANUAL_REVIEW webhook. The shop then checks the receiving bank account and
-- approves the payment in /admin. YOUPI never settles a manual-UPI session on
-- its own, so this database is the source of truth for "paid".

-- The quotation form already collects an optional email; it was previously
-- dropped on submit. The checkout passes it to the gateway when present.
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(200);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS gateway_order_id TEXT;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS utr TEXT,
  ADD COLUMN IF NOT EXISTS checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS gateway_status TEXT,
  ADD COLUMN IF NOT EXISTS settlement_state TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_by TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_orders_enquiry_id
  ON orders(enquiry_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments(status, created_at DESC);

-- One open attempt per order. A retry always supersedes the previous attempt,
-- so two open rows would mean the customer could pay the same quotation twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_open_per_order
  ON payments(order_id)
  WHERE status IN ('pending', 'review');

-- Webhook deliveries are deduplicated on YOUPI's X-Gateway-Delivery-Id. YOUPI
-- retries a delivery when the response is lost, so the primary key is what keeps
-- a retry from being applied twice.
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  delivery_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event TEXT NOT NULL,
  gateway_payment_id TEXT,
  gateway_order_id TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment
  ON payment_webhook_events(gateway_payment_id);
