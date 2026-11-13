import "server-only";

import {
  isYoupiEvent,
  localStatusForEvent,
  localStatusForGatewayStatus,
  paiseToRupees,
  rupeesToPaise,
  verifyWebhookSignature,
  type LocalPaymentStatus,
  type YoupiEvent,
  type YoupiStatus,
} from "./payment-core";

/**
 * Server-only client for the YOUPI-PG merchant API.
 *
 * The site uses YOUPI's `MANUAL_UPI` method for approved quotations: the
 * customer scans the gateway QR, pays from their own UPI app, and submits the
 * UPI reference (UTR) in the YOUPI checkout. YOUPI records MANUAL_REVIEW and
 * sends a signed webhook. YOUPI deliberately never settles a manual-UPI session
 * itself — the shop checks the receiving bank account and approves the payment
 * in /admin. That keeps this database, not the gateway, authoritative for "paid".
 *
 * The merchant API key and webhook secret are read from the server environment
 * and are never sent to the browser.
 */

export const YOUPI_PROVIDER = "youpi";

export { isYoupiEvent, localStatusForEvent, localStatusForGatewayStatus };
export { paiseToRupees, rupeesToPaise };
export type { LocalPaymentStatus, YoupiEvent, YoupiStatus };

export type YoupiMethod = "MANUAL_UPI" | "UPI" | "COD" | "CASH_COUNTER" | "CARD_COUNTER";

export type YoupiPayment = {
  paymentId: string;
  orderId: string;
  amount: string;
  amountPaise?: string | number;
  currency: string;
  status: YoupiStatus;
  checkoutUrl?: string;
  method?: string;
  settlementState?: string;
  completedAt?: string | null;
};

export type YoupiWebhookPayload = {
  event: YoupiEvent;
  deliveryId?: string;
  paymentId: string;
  orderId: string;
  amount: string;
  amountPaise: number;
  currency: string;
  method: string;
  utr?: string;
  settlementState?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
};

/** A gateway call that failed. `code` is YOUPI's machine-readable code when present. */
export class YoupiError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus: number) {
    super(message);
    this.name = "YoupiError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

type YoupiConfig = {
  /** Operator switch. `PAYMENTS_ENABLED=false` hides the checkout entirely. */
  enabled: boolean;
  /** True only when the merchant credentials are present. */
  configured: boolean;
  apiUrl: string;
  merchantId: string;
  merchantKey: string;
  webhookSecret: string;
  method: YoupiMethod;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Resolves the gateway configuration. Missing credentials are reported, never
 * guessed, so the site can degrade to "online payment is not available yet"
 * instead of showing a pay button that always fails.
 */
export function getYoupiConfig(): YoupiConfig {
  const enabled = (process.env.PAYMENTS_ENABLED ?? "true").trim().toLowerCase() !== "false";
  const apiUrl = trimTrailingSlash(
    process.env.YOUPI_API_URL?.trim() || "http://localhost:7000",
  );
  const merchantId = process.env.YOUPI_MERCHANT_ID?.trim() ?? "";
  const merchantKey = process.env.YOUPI_MERCHANT_API_KEY?.trim() ?? "";
  const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET?.trim() ?? "";
  const method = (process.env.YOUPI_METHOD?.trim() || "MANUAL_UPI") as YoupiMethod;

  return {
    enabled,
    configured: Boolean(merchantId && merchantKey && webhookSecret),
    apiUrl,
    merchantId,
    merchantKey,
    webhookSecret,
    method,
  };
}

/** True when the customer may be offered the online checkout. */
export function isPaymentCheckoutAvailable(): boolean {
  const config = getYoupiConfig();
  return config.enabled && config.configured;
}

function assertUsable(config: YoupiConfig) {
  if (!config.enabled) {
    throw new YoupiError(
      "Online payment is switched off.",
      "PAYMENTS_DISABLED",
      503,
    );
  }
  if (!config.configured) {
    throw new YoupiError(
      "Online payment is not configured yet.",
      "PAYMENTS_NOT_CONFIGURED",
      503,
    );
  }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const data = await response.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalisePayment(data: Record<string, unknown>): YoupiPayment {
  const paymentId = asString(data.paymentId);
  const orderId = asString(data.orderId);
  const status = asString(data.status) as YoupiStatus | undefined;

  if (!paymentId || !orderId || !status) {
    throw new YoupiError(
      "The payment gateway returned an unexpected response.",
      "INVALID_GATEWAY_RESPONSE",
      502,
    );
  }

  return {
    paymentId,
    orderId,
    amount: asString(data.amount) ?? "0.00",
    amountPaise: data.amountPaise as string | number | undefined,
    currency: asString(data.currency) ?? "INR",
    status,
    checkoutUrl: asString(data.checkoutUrl),
    method: asString(data.method),
    settlementState: asString(data.settlementState),
    completedAt: typeof data.completedAt === "string" ? data.completedAt : null,
  };
}

/**
 * Creates a payment session, or returns the existing open session for the same
 * order. YOUPI is idempotent on `orderId`, so a customer refreshing the page
 * resumes the same attempt instead of creating a second one.
 */
export async function createYoupiPayment(input: {
  orderId: string;
  amount: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  description?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
}): Promise<YoupiPayment> {
  const config = getYoupiConfig();
  assertUsable(config);

  const timeoutMs = Number(process.env.YOUPI_REQUEST_TIMEOUT_MS) || 15_000;

  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Merchant-Id": config.merchantId,
        "X-Merchant-Key": config.merchantKey,
        "Idempotency-Key": `quote:${input.orderId}`,
      },
      body: JSON.stringify({
        orderId: input.orderId,
        amount: input.amount,
        currency: "INR",
        method: config.method,
        customer: {
          name: input.customerName,
          phoneNumber: input.customerPhone,
          email: input.customerEmail,
        },
        description: input.description,
        returnUrl: input.returnUrl,
        metadata: input.metadata ?? {},
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    throw new YoupiError(
      error instanceof Error && error.name === "TimeoutError"
        ? "The payment gateway did not respond in time."
        : "Could not reach the payment gateway.",
      "GATEWAY_UNREACHABLE",
      502,
    );
  }

  const data = await readJson(response);

  if (!response.ok) {
    const code =
      asString(data.code) ?? asString(data.error) ?? `GATEWAY_HTTP_${response.status}`;
    const message = asString(data.message) ?? asString(data.error) ?? "The payment gateway rejected the request.";
    throw new YoupiError(message, code, response.status);
  }

  return normalisePayment(data);
}

/**
 * Reads a payment session. Used to reconcile a missed webhook when the customer
 * returns from the checkout, and to show live status while a payment is open.
 */
export async function getYoupiPayment(paymentId: string): Promise<YoupiPayment | null> {
  const config = getYoupiConfig();
  assertUsable(config);

  const timeoutMs = Number(process.env.YOUPI_REQUEST_TIMEOUT_MS) || 15_000;

  const response = await fetch(
    `${config.apiUrl}/api/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        "X-Merchant-Id": config.merchantId,
        "X-Merchant-Key": config.merchantKey,
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new YoupiError(
      "Could not read the payment status from the gateway.",
      `GATEWAY_HTTP_${response.status}`,
      502,
    );
  }

  return normalisePayment(await readJson(response));
}

/** Verifies a webhook against the configured signing secret. */
export function verifyYoupiWebhook(input: {
  rawBody: string;
  signature: string | null;
  signatureV2?: string | null;
  timestamp?: string | null;
}): boolean {
  return verifyWebhookSignature({
    secret: getYoupiConfig().webhookSecret,
    rawBody: input.rawBody,
    signature: input.signature,
    signatureV2: input.signatureV2,
    timestamp: input.timestamp,
  });
}
