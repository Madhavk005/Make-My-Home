import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await pool.query(`SELECT reference, quote_amount, quote_reply, quote_approved_at FROM enquiries WHERE quote_token = $1 AND status = 'quoted'`, [token]);
  if (!result.rowCount) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}
