import { NextResponse } from "next/server";
import { applyYoupiWebhook } from "@/lib/quote-payments";
import {
  isYoupiEvent,
  verifyYoupiWebhook,
  type YoupiWebhookPayload,
} from "@/lib/youpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64_000;

/**
 * Authoritative payment webhook from YOUPI-PG.
 *
 * The signature is computed over the raw request bytes, so the body is read as
 * text before any parsing. A browser callback or a checkout redirect is never
 * treated as proof of payment.
 */
export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const valid = verifyYoupiWebhook({
    rawBody,
    signature: request.headers.get("x-gateway-signature"),
    signatureV2: request.headers.get("x-gateway-signature-v2"),
    timestamp: request.headers.get("x-gateway-timestamp"),
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: YoupiWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as YoupiWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (
    !payload ||
    !isYoupiEvent(payload.event) ||
    typeof payload.paymentId !== "string" ||
    typeof payload.orderId !== "string" ||
    !Number.isFinite(Number(payload.amountPaise))
  ) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const deliveryId =
    request.headers.get("x-gateway-delivery-id")?.trim() ||
    payload.deliveryId?.trim() ||
    `${payload.paymentId}:${payload.event}`;

  try {
    const result = await applyYoupiWebhook(
      { ...payload, amountPaise: Number(payload.amountPaise) },
      deliveryId,
    );

    // Returning 200 on a duplicate stops YOUPI from retrying a delivery that has
    // already been applied.
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    console.error("YOUPI webhook processing failed:", error);
    // A 500 asks YOUPI to retry, which is what we want for a transient DB error.
    return NextResponse.json({ error: "Could not record the webhook." }, { status: 500 });
  }
}
