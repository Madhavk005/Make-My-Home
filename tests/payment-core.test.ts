import test from "node:test";
import assert from "node:assert/strict";
import {
  isYoupiEvent,
  localStatusForEvent,
  localStatusForGatewayStatus,
  paiseToRupees,
  rupeesToPaise,
  signWebhookBody,
  verifyWebhookSignature,
} from "../src/lib/payment-core";

test("rupeesToPaise converts rupee amounts without float drift", () => {
  assert.equal(rupeesToPaise("120"), 12_000);
  assert.equal(rupeesToPaise("120.5"), 12_050);
  assert.equal(rupeesToPaise("120.05"), 12_005);
  assert.equal(rupeesToPaise("99999999.99"), 9_999_999_999);
  // Float artefacts are refused rather than silently rounded into a charge.
  assert.throws(() => rupeesToPaise(0.1 + 0.2), /rupee value/);
});

test("rupeesToPaise rejects malformed or negative amounts", () => {
  for (const value of ["1.234", "-5", "abc", "1,000", "", "  "]) {
    assert.throws(() => rupeesToPaise(value), /rupee value/);
  }
});

test("paiseToRupees always renders two decimals", () => {
  assert.equal(paiseToRupees(12_000), "120.00");
  assert.equal(paiseToRupees(5), "0.05");
  assert.throws(() => paiseToRupees(-1), /non-negative/);
  assert.throws(() => paiseToRupees(1.5), /non-negative/);
});

test("a manual-UPI webhook never marks a quotation paid", () => {
  assert.equal(localStatusForEvent("MANUAL_REVIEW", "MANUAL_UPI"), "review");
  assert.equal(localStatusForEvent("OBSERVED_SUCCESS", "UPI"), "review");
  assert.equal(localStatusForEvent("SUCCESS", "UPI"), "review");
  assert.equal(localStatusForEvent("SUCCESS", "COD"), "paid");
  assert.equal(localStatusForEvent("SUCCESS", "CASH_COUNTER"), "paid");
  assert.equal(localStatusForEvent("RECONCILED", "UPI"), "paid");
});

test("failed, expired and cancelled outcomes free the quotation for a retry", () => {
  assert.equal(localStatusForEvent("FAILED", "MANUAL_UPI"), "failed");
  assert.equal(localStatusForEvent("EXPIRED", "MANUAL_UPI"), "failed");
  assert.equal(localStatusForEvent("CANCELLED", "MANUAL_UPI"), "failed");
});

test("live gateway statuses map onto the same local states", () => {
  assert.equal(localStatusForGatewayStatus("INITIATED", "MANUAL_UPI"), "pending");
  assert.equal(localStatusForGatewayStatus("ACTIVE", "MANUAL_UPI"), "pending");
  assert.equal(localStatusForGatewayStatus("MANUAL_REVIEW", "MANUAL_UPI"), "review");
  assert.equal(localStatusForGatewayStatus("RECONCILED", "MANUAL_UPI"), "paid");
  assert.equal(localStatusForGatewayStatus("EXPIRED", "MANUAL_UPI"), "failed");
});

test("isYoupiEvent accepts only documented outcomes", () => {
  assert.equal(isYoupiEvent("MANUAL_REVIEW"), true);
  assert.equal(isYoupiEvent("OBSERVED_SUCCESS"), true);
  assert.equal(isYoupiEvent("PAID"), false);
  assert.equal(isYoupiEvent(null), false);
});

test("webhook signature accepts the signed body and rejects tampering", () => {
  const secret = "test-webhook-secret";
  const body = JSON.stringify({ event: "MANUAL_REVIEW", paymentId: "p1", orderId: "o1" });
  const signature = `sha256=${signWebhookBody(secret, body)}`;

  assert.equal(
    verifyWebhookSignature({ secret, rawBody: body, signature }),
    true,
  );

  const tampered = body.replace("p1", "p2");
  assert.equal(
    verifyWebhookSignature({ secret, rawBody: tampered, signature }),
    false,
  );

  assert.equal(
    verifyWebhookSignature({ secret: "wrong-secret", rawBody: body, signature }),
    false,
  );

  assert.equal(verifyWebhookSignature({ secret, rawBody: body, signature: null }), false);
  assert.equal(verifyWebhookSignature({ secret: "", rawBody: body, signature }), false);
});

test("timestamped V2 signature is verified over timestamp and body", () => {
  const secret = "test-webhook-secret";
  const body = '{"event":"MANUAL_REVIEW"}';
  const timestamp = "1700000000000";
  const signatureV2 = `sha256=${signWebhookBody(secret, `${timestamp}.${body}`)}`;

  assert.equal(
    verifyWebhookSignature({ secret, rawBody: body, signature: null, signatureV2, timestamp }),
    true,
  );

  assert.equal(
    verifyWebhookSignature({
      secret,
      rawBody: body,
      signature: null,
      signatureV2,
      timestamp: "1700000000001",
    }),
    false,
  );
});

test("non-hex or wrong-length signatures are rejected without throwing", () => {
  const body = "{}";
  assert.equal(
    verifyWebhookSignature({ secret: "s", rawBody: body, signature: "sha256=zzzz" }),
    false,
  );
  assert.equal(
    verifyWebhookSignature({ secret: "s", rawBody: body, signature: "sha256=abcd" }),
    false,
  );
});
