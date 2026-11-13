import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  isQuoteToken,
  loadQuoteByToken,
  QuotePaymentError,
  startQuotePayment,
} from "@/lib/quote-payments";
import { getSiteOrigin } from "@/lib/site-origin";
import { YoupiError } from "@/lib/youpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts or resumes the online payment for an approved quotation.
 *
 * The amount is taken from the quotation row, never from the request body, so a
 * customer cannot pay a different amount than the shop approved.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`quote-pay:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many payment attempts. Please wait a minute." }, { status: 429 });
  }

  const { token } = await params;
  if (!isQuoteToken(token)) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  const quote = await loadQuoteByToken(token);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  try {
    const payment = await startQuotePayment({
      quote,
      returnUrl: `${getSiteOrigin()}/quote/${token}`,
    });

    return NextResponse.json(
      {
        checkoutUrl: payment.checkoutUrl,
        paymentId: payment.paymentId,
        status: payment.status,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof QuotePaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus },
      );
    }

    if (error instanceof YoupiError) {
      // 409 means the gateway already holds this order with a different amount
      // or method: an operator changed the quote after a payment started.
      const status = error.httpStatus === 409 ? 409 : error.httpStatus >= 500 ? 503 : 502;
      console.error("YOUPI payment creation failed:", error.code, error.message);
      return NextResponse.json(
        {
          error:
            error.code === "PAYMENTS_NOT_CONFIGURED" || error.code === "PAYMENTS_DISABLED"
              ? "Online payment is not available right now."
              : "The payment gateway could not start this payment. Please try again or call the shop.",
          code: error.code,
        },
        { status },
      );
    }

    console.error("Quote payment failed:", error);
    return NextResponse.json(
      { error: "Could not start the online payment." },
      { status: 500 },
    );
  }
}
