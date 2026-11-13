import { NextResponse } from "next/server";
import { getAdminSession, isMainAdminEmail } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { confirmPayment, QuotePaymentError } from "@/lib/quote-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records the shop's decision on a manual-UPI payment after the money has been
 * checked in the receiving bank account.
 *
 * YOUPI never settles a manual-UPI claim, so this endpoint is the only place a
 * quotation becomes "paid". When MAIN_ADMIN_EMAIL is configured, only that
 * account may move money.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = session.user.email ?? "";
  const mainAdmin = process.env.MAIN_ADMIN_EMAIL?.trim().toLowerCase();
  if (mainAdmin && !isMainAdminEmail(email)) {
    return NextResponse.json(
      { error: "Only the main administrator can confirm payments." },
      { status: 403 },
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: { decision?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.decision !== "verified" && body.decision !== "rejected") {
    return NextResponse.json(
      { error: "Decision must be 'verified' or 'rejected'." },
      { status: 400 },
    );
  }

  if (body.notes !== undefined && typeof body.notes !== "string") {
    return NextResponse.json({ error: "Invalid notes." }, { status: 400 });
  }

  if (body.decision === "rejected" && !body.notes?.trim()) {
    return NextResponse.json(
      { error: "A rejection needs a reason." },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const result = await confirmPayment({
      paymentId: id,
      decision: body.decision,
      actorEmail: email,
      notes: body.notes?.trim(),
    });
    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    if (error instanceof QuotePaymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus },
      );
    }
    console.error("Payment confirmation failed:", error);
    return NextResponse.json({ error: "Could not record the decision." }, { status: 500 });
  }
}
