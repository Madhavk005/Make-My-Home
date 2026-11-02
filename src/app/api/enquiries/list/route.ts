import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const client = await pool.connect();
  try {
    const params: unknown[] = [];
    let where = "";
    if (status && status !== "all") {
      where = "WHERE status = $1";
      params.push(status);
    }
    const result = await client.query(
      `SELECT e.id, e.reference, e.customer_name, e.customer_mobile, e.delivery_location,
              e.status, e.customer_note, e.created_at, e.updated_at,
              COALESCE(json_agg(json_build_object(
                'id', ei.id,
                'productId', ei.product_id,
                'productSlug', ei.product_slug,
                'productName', ei.product_name,
                'brand', ei.brand,
                'sku', ei.sku,
                'variantLabel', ei.variant_label,
                'attributes', ei.attributes,
                'quantity', ei.quantity,
                'unit', ei.unit,
                'price', ei.price,
                'priceStatus', ei.price_status,
                'availability', ei.availability,
                'notes', ei.notes,
                'imageUrl', ei.image_url
              )) FILTER (WHERE ei.id IS NOT NULL), '[]') AS items
       FROM enquiries e
       LEFT JOIN enquiry_items ei ON ei.enquiry_id = e.id
       ${where}
       GROUP BY e.id
       ORDER BY e.created_at DESC
       LIMIT 200`,
      params,
    );
    return NextResponse.json({ enquiries: result.rows });
  } finally {
    client.release();
  }
}
