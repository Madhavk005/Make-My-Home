import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pure payment helpers shared by the gateway client, the quote flow and tests.
 *
 * This module deliberately has no `server-only` marker and no environment
 * access so it can be unit tested. Anything that reads secrets or performs
 * network calls lives in `youpi.ts`.
 */

export type YoupiEvent =
  | "SUCCESS"
  | "OBSERVED_SUCCESS"
  | "RECONCILED"
  | "MANUAL_REVIEW"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type YoupiStatus =
  | "INITIATED"
  | "ACTIVE"
  | "QUEUED"
  | "PROCESSING"
  | "SUCCESS"
  | "OBSERVED_SUCCESS"
  | "RECONCILED"
  | "MANUAL_REVIEW"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type LocalPaymentStatus = "pending" | "review" | "paid" | "failed" | "refunded";

export function isYoupiEvent(value: unknown): value is YoupiEvent {
  return (
    value === "SUCCESS" ||
    value === "OBSERVED_SUCCESS" ||
    value === "RECONCILED" ||
    value === "MANUAL_REVIEW" ||
    value === "FAILED" ||
    value === "EXPIRED" ||
    value === "CANCELLED"
  );
}

/**
 * Maps a gateway outcome onto this app's payment state.
 *
 * A manual-UPI claim is never "paid" on a webhook: submitting a UTR raises
 * MANUAL_REVIEW and an admin must confirm the bank credit. Only a reconciled
 * statement match, or a completed cash/counter payment, marks the record paid.
 */
export function localStatusForEvent(event: YoupiEvent, method: string): LocalPaymentStatus {
  switch (event) {
    case "RECONCILED":
      return "paid";
    case "SUCCESS":
      return method === "COD" || method === "CASH_COUNTER" || method === "CARD_COUNTER"
        ? "paid"
        : "review";
    case "OBSERVED_SUCCESS":
    case "MANUAL_REVIEW":
      return "review";
    case "FAILED":
    case "EXPIRED":
    case "CANCELLED":
      return "failed";
    default:
      return "pending";
  }
}

/** Same mapping, for a session read back from the status endpoint. */
export function localStatusForGatewayStatus(
  status: YoupiStatus,
  method: string,
): LocalPaymentStatus {
  switch (status) {
    case "RECONCILED":
      return "paid";
    case "SUCCESS":
      return method === "COD" || method === "CASH_COUNTER" || method === "CARD_COUNTER"
        ? "paid"
        : "review";
    case "OBSERVED_SUCCESS":
    case "MANUAL_REVIEW":
      return "review";
    case "FAILED":
    case "EXPIRED":
    case "CANCELLED":
      return "failed";
    default:
      return "pending";
  }
}

/** Money helpers. String-based so a quote amount never picks up float error. */
export function rupeesToPaise(value: string | number): number {
  const text = String(value).trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) {
    throw new Error("Amount must be a positive rupee value with at most two decimals.");
  }
  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function paiseToRupees(paise: number): string {
  if (!Number.isInteger(paise) || paise < 0) {
    throw new Error("Paise must be a non-negative integer.");
  }
  return (paise / 100).toFixed(2);
}

function safeEqualHex(leftHex: string, rightHex: string): boolean {
  if (leftHex.length !== rightHex.length) return false;
  try {
    return timingSafeEqual(Buffer.from(leftHex, "hex"), Buffer.from(rightHex, "hex"));
  } catch {
    return false;
  }
}

function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Computes the body signature YOUPI sends in `X-Gateway-Signature`. */
export function signWebhookBody(secret: string, rawBody: string): string {
  return hmacHex(secret, rawBody);
}

/**
 * Verifies a YOUPI webhook signature.
 *
 * YOUPI sends both a body signature (`X-Gateway-Signature`) and a
 * timestamp-bound signature (`X-Gateway-Signature-V2`). V2 is preferred because
 * it also covers the timestamp. Replay protection comes from deduplicating the
 * delivery id, not from rejecting old timestamps: a legitimate retry can arrive
 * minutes after the original attempt.
 */
export function verifyWebhookSignature(input: {
  secret: string;
  rawBody: string;
  signature: string | null;
  signatureV2?: string | null;
  timestamp?: string | null;
}): boolean {
  if (!input.secret) return false;

  const strip = (value: string) => value.trim().replace(/^sha256=/i, "");

  if (input.signatureV2 && input.timestamp) {
    const provided = strip(input.signatureV2);
    if (provided) {
      const expected = hmacHex(input.secret, `${input.timestamp}.${input.rawBody}`);
      if (safeEqualHex(expected, provided)) return true;
    }
  }

  if (!input.signature) return false;
  const provided = strip(input.signature);
  if (!provided) return false;

  return safeEqualHex(hmacHex(input.secret, input.rawBody), provided);
}
