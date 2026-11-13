import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isQuoteToken,
  loadQuoteByToken,
  syncOpenPayment,
} from "@/lib/quote-payments";
import { isPaymentCheckoutAvailable } from "@/lib/youpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public status endpoint for an approved quotation.
 *
 * The token is the capability: it is an unguessable UUID that the shop sends to
 * one customer, so the response deliberately excludes the customer's phone,
 * email and internal notes.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`quote:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { token } = await params;
  if (!isQuoteToken(token)) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  const quote = await loadQuoteByToken(token);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  // A missed webhook must not strand the customer on "pending": ask the gateway
  // for the live status while the payment is still open.
  const payment =
    quote.payment && quote.payment.status !== "paid"
      ? await syncOpenPayment(quote).catch(() => quote.payment)
      : quote.payment;

  return NextResponse.json({
    reference: quote.reference,
    quoteAmount: quote.quoteAmount,
    quoteReply: quote.quoteReply,
    quoteApprovedAt: quote.quoteApprovedAt,
    status: quote.status,
    checkoutAvailable: isPaymentCheckoutAvailable(),
    payment: payment
      ? {
          status: payment.status,
          amount: payment.amount,
          utr: payment.utr,
          confirmedAt: payment.confirmedAt,
        }
      : null,
  });
}
