import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function ApprovedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await pool.query(`SELECT reference, quote_amount, quote_reply FROM enquiries WHERE quote_token = $1 AND status = 'quoted'`, [token]);
  if (!result.rowCount) notFound();
  const quote = result.rows[0];
  return <main className="mx-auto max-w-xl px-4 py-12"><section className="rounded-xl border border-line bg-white p-6 shadow-sm"><p className="text-sm text-ink-soft">Approved quotation {quote.reference}</p><h1 className="mt-2 text-2xl font-bold text-ink">Your vendor has replied</h1><p className="mt-4 whitespace-pre-wrap text-ink-soft">{quote.quote_reply}</p><p className="mt-6 text-2xl font-bold text-ink">₹{Number(quote.quote_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p><p className="mt-4 text-sm text-ink-soft">Checkout will appear here after YOUPI-PG is configured.</p></section></main>;
}
