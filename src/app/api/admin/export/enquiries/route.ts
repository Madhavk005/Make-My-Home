import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT reference, customer_name, customer_phone, customer_location, status, created_at
       FROM enquiries ORDER BY created_at DESC`,
    );
    const header = "reference,customer_name,customer_phone,customer_location,status,created_at\n";
    const rows = result.rows
      .map((row) =>
        [row.reference, row.customer_name, row.customer_phone, row.customer_location ?? "", row.status, row.created_at]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=enquiries.csv",
      },
    });
  } finally {
    client.release();
  }
}
