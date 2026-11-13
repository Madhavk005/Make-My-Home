import "server-only";

import type { PoolClient } from "pg";
import { pool } from "./db";
import {
  createYoupiPayment,
  getYoupiPayment,
  getYoupiConfig,
  isPaymentCheckoutAvailable,
  localStatusForEvent,
  localStatusForGatewayStatus,
  rupeesToPaise,
  YOUPI_PROVIDER,
  type LocalPaymentStatus,
  type YoupiWebhookPayload,
} from "./youpi";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isQuoteToken(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type QuotePaymentSummary = {
  id: string;
  providerPaymentId: string | null;
  amount: number;
  status: LocalPaymentStatus;
  method: string | null;
  utr: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

export type QuoteRecord = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  status: string;
  quoteAmount: number | null;
  quoteReply: string | null;
  quoteApprovedAt: string | null;
  payment: QuotePaymentSummary | null;
};

/** Loads an approved quotation (or a paid one) by its capability token. */
export async function loadQuoteByToken(token: string): Promise<QuoteRecord | null> {
  if (!isQuoteToken(token)) return null;

  const result = await pool.query(
    `SELECT id, reference, customer_name, customer_phone, customer_email,
            status, quote_amount, quote_reply, quote_approved_at
       FROM enquiries
      WHERE quote_token = $1
        AND status IN ('quoted', 'converted')
      LIMIT 1`,
    [token],
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];

  return {
    id: row.id,
    reference: row.reference,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? null,
    status: row.status,
    quoteAmount: row.quote_amount === null ? null : Number(row.quote_amount),
    quoteReply: row.quote_reply ?? null,
    quoteApprovedAt: row.quote_approved_at
      ? new Date(row.quote_approved_at).toISOString()
      : null,
    payment: await loadLatestPayment(row.id),
  };
}

function mapPaymentRow(row: Record<string, unknown>): QuotePaymentSummary {
  return {
    id: String(row.id),
    providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : null,
    amount: Number(row.amount),
    status: row.status as LocalPaymentStatus,
    method: row.method ? String(row.method) : null,
    utr: row.utr ? String(row.utr) : null,
    checkoutUrl: row.checkout_url ? String(row.checkout_url) : null,
    createdAt: new Date(row.created_at as string).toISOString(),
    confirmedAt: row.confirmed_at
      ? new Date(row.confirmed_at as string).toISOString()
      : null,
  };
}

async function loadLatestPayment(enquiryId: string): Promise<QuotePaymentSummary | null> {
  const result = await pool.query(
    `SELECT p.id, p.provider_payment_id, p.amount, p.status, p.method, p.utr,
            p.checkout_url, p.created_at, p.confirmed_at
       FROM payments p
       JOIN orders o ON o.id = p.order_id
      WHERE o.enquiry_id = $1
      ORDER BY p.created_at DESC
      LIMIT 1`,
    [enquiryId],
  );

  if (result.rowCount === 0) return null;
  return mapPaymentRow(result.rows[0]);
}

/** One order row per enquiry. Created on the first payment attempt. */
async function ensureOrder(quote: QuoteRecord): Promise<{ orderId: string; gatewayOrderId: string }> {
  if (quote.quoteAmount === null || quote.quoteAmount <= 0) {
    throw new Error("This quotation has no approved amount.");
  }

  const amount = quote.quoteAmount.toFixed(2);
  const gatewayOrderId = `MMH-Q-${quote.reference}-${rupeesToPaise(amount)}`;

  const existing = await pool.query(
    `SELECT id FROM orders WHERE enquiry_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [quote.id],
  );

  if (existing.rowCount) {
    const orderId = existing.rows[0].id as string;
    await pool.query(
      `UPDATE orders
          SET amount = $2, gateway_order_id = $3, updated_at = NOW()
        WHERE id = $1`,
      [orderId, amount, gatewayOrderId],
    );
    return { orderId, gatewayOrderId };
  }

  const inserted = await pool.query(
    `INSERT INTO orders (enquiry_id, amount, status, gateway_order_id)
     VALUES ($1, $2, 'pending', $3)
     RETURNING id`,
    [quote.id, amount, gatewayOrderId],
  );

  return { orderId: inserted.rows[0].id as string, gatewayOrderId };
}

export class QuotePaymentError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus: number) {
    super(message);
    this.name = "QuotePaymentError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * Starts (or resumes) the online payment for an approved quotation.
 *
 * YOUPI treats `orderId` as the idempotency key, so pressing Pay twice, or
 * refreshing the quote page, resumes the same session rather than creating a
 * second charge. A previously failed attempt is superseded.
 */
export async function startQuotePayment(input: {
  quote: QuoteRecord;
  returnUrl: string;
}): Promise<{ checkoutUrl: string; paymentId: string; status: LocalPaymentStatus }> {
  const { quote } = input;

  if (!isPaymentCheckoutAvailable()) {
    throw new QuotePaymentError(
      "Online payment is not available right now.",
      "PAYMENTS_UNAVAILABLE",
      503,
    );
  }

  if (quote.status === "converted" || quote.payment?.status === "paid") {
    throw new QuotePaymentError("This quotation is already paid.", "ALREADY_PAID", 409);
  }

  if (quote.payment?.status === "review") {
    throw new QuotePaymentError(
      "A payment reference has already been submitted. The shop is verifying it.",
      "PAYMENT_AWAITING_VERIFICATION",
      409,
    );
  }

  if (quote.quoteAmount === null || quote.quoteAmount <= 0) {
    throw new QuotePaymentError(
      "This quotation has no approved amount.",
      "NO_AMOUNT",
      409,
    );
  }

  const amount = quote.quoteAmount.toFixed(2);
  const { orderId, gatewayOrderId } = await ensureOrder(quote);
  const config = getYoupiConfig();

  const gateway = await createYoupiPayment({
    orderId: gatewayOrderId,
    amount,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    customerEmail: quote.customerEmail ?? undefined,
    description: `Approved quotation ${quote.reference}`,
    returnUrl: input.returnUrl,
    metadata: {
      enquiryId: quote.id,
      reference: quote.reference,
    },
  });

  if (!gateway.checkoutUrl) {
    throw new QuotePaymentError(
      "The payment gateway did not return a checkout link.",
      "NO_CHECKOUT_URL",
      502,
    );
  }

  const status = localStatusForGatewayStatus(
    gateway.status,
    gateway.method ?? config.method,
  );

  await pool.query(
    `UPDATE payments
        SET status = 'failed',
            failure_reason = 'Superseded by a newer payment attempt',
            updated_at = NOW()
      WHERE order_id = $1
        AND status IN ('pending', 'review')
        AND (provider_payment_id IS NULL OR provider_payment_id <> $2)`,
    [orderId, gateway.paymentId],
  );

  await pool.query(
    `INSERT INTO payments (
       order_id, provider, provider_payment_id, amount, status, method,
       checkout_url, gateway_status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (provider_payment_id) DO UPDATE SET
       status = EXCLUDED.status,
       method = EXCLUDED.method,
       checkout_url = EXCLUDED.checkout_url,
       gateway_status = EXCLUDED.gateway_status,
       -- A retry after a rejection starts a clean claim: the previous UTR and
       -- failure reason must not describe the new attempt.
       utr = CASE WHEN payments.status = 'failed' THEN NULL ELSE payments.utr END,
       failure_reason = CASE WHEN payments.status = 'failed' THEN NULL ELSE payments.failure_reason END,
       settlement_state = CASE WHEN payments.status = 'failed' THEN NULL ELSE payments.settlement_state END,
       updated_at = NOW()`,
    [
      orderId,
      YOUPI_PROVIDER,
      gateway.paymentId,
      amount,
      status,
      gateway.method ?? config.method,
      gateway.checkoutUrl,
      gateway.status,
    ],
  );

  return { checkoutUrl: gateway.checkoutUrl, paymentId: gateway.paymentId, status };
}

/**
 * Reconciles an open payment against the gateway. Called when the customer
 * returns from checkout and while the quote page polls, so a webhook that never
 * arrived cannot leave the customer staring at "pending" forever.
 */
export async function syncOpenPayment(quote: QuoteRecord): Promise<QuotePaymentSummary | null> {
  const payment = quote.payment;
  if (!payment || !payment.providerPaymentId) return payment;
  if (payment.status !== "pending" && payment.status !== "review") return payment;
  if (!isPaymentCheckoutAvailable()) return payment;

  const gateway = await getYoupiPayment(payment.providerPaymentId).catch(() => null);
  if (!gateway) return payment;

  const status = localStatusForGatewayStatus(gateway.status, gateway.method ?? "");

  // A webhook is authoritative once the UTR is recorded; never downgrade review.
  if (payment.status === "review" && (status === "pending" || status === "failed")) {
    return payment;
  }

  await pool.query(
    `UPDATE payments
        SET status = $2,
            gateway_status = $3,
            settlement_state = COALESCE($4, settlement_state),
            checkout_url = COALESCE($5, checkout_url),
            updated_at = NOW()
      WHERE id = $1`,
    [payment.id, status, gateway.status, gateway.settlementState ?? null, gateway.checkoutUrl ?? null],
  );

  return { ...payment, status };
}

export type WebhookResult = {
  duplicate: boolean;
  applied: boolean;
  paymentId: string | null;
};

/**
 * Applies a verified YOUPI webhook exactly once.
 *
 * `deliveryId` is the deduplication key. YOUPI retries a delivery when the
 * response is lost, so the same payload can legitimately arrive several times.
 */
export async function applyYoupiWebhook(
  payload: YoupiWebhookPayload,
  deliveryId: string,
): Promise<WebhookResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const recorded = await client.query(
      `INSERT INTO payment_webhook_events (
         delivery_id, provider, event, gateway_payment_id, gateway_order_id, payload
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (delivery_id) DO NOTHING
       RETURNING delivery_id`,
      [
        deliveryId,
        YOUPI_PROVIDER,
        payload.event,
        payload.paymentId,
        payload.orderId,
        JSON.stringify(payload),
      ],
    );

    if (recorded.rowCount === 0) {
      await client.query("ROLLBACK");
      return { duplicate: true, applied: false, paymentId: payload.paymentId };
    }

    const status = localStatusForEvent(payload.event, payload.method);
    const utr = payload.utr?.trim() || null;

    const existing = await client.query(
      `SELECT id, order_id, amount
         FROM payments
        WHERE provider_payment_id = $1
        FOR UPDATE`,
      [payload.paymentId],
    );

    if (existing.rowCount === 0) {
      await client.query("COMMIT");
      return { duplicate: false, applied: false, paymentId: payload.paymentId };
    }

    const payment = existing.rows[0];

    // A webhook can only move the attempt it names. If the signed amount does
    // not match the amount we asked for, record the event for the audit trail
    // but never change the payment state.
    const expectedPaise = Math.round(Number(payment.amount) * 100);
    if (Number.isFinite(payload.amountPaise) && payload.amountPaise !== expectedPaise) {
      await client.query("COMMIT");
      console.error(
        "YOUPI webhook amount mismatch:",
        payload.paymentId,
        payload.amountPaise,
        expectedPaise,
      );
      return { duplicate: false, applied: false, paymentId: payload.paymentId };
    }

    const updated = await client.query(
      `UPDATE payments
          SET status = CASE WHEN status = 'paid' THEN status ELSE $2 END,
              utr = COALESCE(NULLIF($3, ''), utr),
              gateway_status = $4,
              settlement_state = COALESCE($5, settlement_state),
              failure_reason = CASE WHEN $2 = 'failed' THEN $4 ELSE failure_reason END,
              raw_payload = $6,
              updated_at = NOW()
        WHERE id = $1
        RETURNING id, order_id`,
      [
        payment.id,
        status,
        utr,
        payload.event,
        payload.settlementState ?? null,
        JSON.stringify(payload),
      ],
    );

    if (updated.rowCount && status === "paid") {
      await markOrderPaid(client, updated.rows[0].order_id as string);
    }

    await client.query("COMMIT");
    return {
      duplicate: false,
      applied: Boolean(updated.rowCount),
      paymentId: payload.paymentId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markOrderPaid(client: PoolClient, orderId: string) {
  await client.query(
    `UPDATE orders SET status = 'confirmed', updated_at = NOW()
      WHERE id = $1 AND status <> 'confirmed'`,
    [orderId],
  );
  await client.query(
    `UPDATE enquiries SET status = 'converted', updated_at = NOW()
      WHERE id = (SELECT enquiry_id FROM orders WHERE id = $1)
        AND status = 'quoted'`,
    [orderId],
  );
}

export type AdminPayment = QuotePaymentSummary & {
  orderId: string;
  enquiryId: string;
  reference: string;
  customerName: string;
  customerPhone: string;
};

export async function loadAdminPayments(filter: {
  status?: LocalPaymentStatus | "all";
  enquiryId?: string;
  limit?: number;
} = {}): Promise<AdminPayment[]> {
  const values: unknown[] = [];
  const where: string[] = [];

  if (filter.enquiryId) {
    values.push(filter.enquiryId);
    where.push(`o.enquiry_id = $${values.length}`);
  }
  if (filter.status && filter.status !== "all") {
    values.push(filter.status);
    where.push(`p.status = $${values.length}`);
  }

  values.push(Math.min(filter.limit ?? 100, 200));

  const result = await pool.query(
    `SELECT p.id, p.order_id, p.provider_payment_id, p.amount, p.status, p.method,
            p.utr, p.checkout_url, p.created_at, p.confirmed_at,
            o.enquiry_id, e.reference, e.customer_name, e.customer_phone
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       JOIN enquiries e ON e.id = o.enquiry_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY p.created_at DESC
      LIMIT $${values.length}`,
    values,
  );

  return result.rows.map((row) => ({
    ...mapPaymentRow(row),
    orderId: String(row.order_id),
    enquiryId: String(row.enquiry_id),
    reference: String(row.reference),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
  }));
}

/**
 * Records the shop's decision after checking the receiving bank account.
 * Approving marks the quotation converted; rejecting leaves it open so the
 * customer can retry.
 */
export async function confirmPayment(input: {
  paymentId: string;
  decision: "verified" | "rejected";
  actorEmail: string;
  notes?: string;
}): Promise<{ status: LocalPaymentStatus }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query(
      `SELECT p.id, p.order_id, p.status, p.amount, p.utr
         FROM payments p
        WHERE p.id = $1
        FOR UPDATE`,
      [input.paymentId],
    );

    if (found.rowCount === 0) {
      await client.query("ROLLBACK");
      throw new QuotePaymentError("Payment not found.", "NOT_FOUND", 404);
    }

    const payment = found.rows[0];

    if (payment.status === "paid") {
      await client.query("ROLLBACK");
      throw new QuotePaymentError("This payment is already confirmed.", "ALREADY_PAID", 409);
    }

    if (input.decision === "verified") {
      await client.query(
        `UPDATE payments
            SET status = 'paid', confirmed_by = $2, confirmed_at = NOW(),
                failure_reason = NULL, updated_at = NOW()
          WHERE id = $1`,
        [payment.id, input.actorEmail],
      );
      await markOrderPaid(client, payment.order_id as string);
    } else {
      await client.query(
        `UPDATE payments
            SET status = 'failed',
                failure_reason = $2,
                confirmed_by = $3,
                updated_at = NOW()
          WHERE id = $1`,
        [payment.id, input.notes?.slice(0, 500) || "Rejected after bank review", input.actorEmail],
      );
    }

    await client.query(
      `INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'payment', $3, $4)`,
      [
        input.actorEmail,
        input.decision === "verified" ? "confirm_payment" : "reject_payment",
        payment.id,
        JSON.stringify({
          orderId: payment.order_id,
          amount: payment.amount,
          utr: payment.utr,
          notes: input.notes ?? null,
        }),
      ],
    );

    await client.query("COMMIT");
    return { status: input.decision === "verified" ? "paid" : "failed" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
