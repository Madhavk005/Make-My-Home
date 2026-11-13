import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loadAdminPayments } from "@/lib/quote-payments";
import type { LocalPaymentStatus } from "@/lib/youpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: Array<LocalPaymentStatus | "all"> = [
  "all",
  "pending",
  "review",
  "paid",
  "failed",
  "refunded",
];

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get("status") ?? "all";
  const status = STATUSES.includes(requested as LocalPaymentStatus | "all")
    ? (requested as LocalPaymentStatus | "all")
    : "all";
  const enquiryId = url.searchParams.get("enquiryId") ?? undefined;

  const payments = await loadAdminPayments({ status, enquiryId });
  return NextResponse.json({ payments });
}
