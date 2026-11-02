import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT e.*, COALESCE(json_agg(json_build_object(
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
       WHERE e.id = $1
       GROUP BY e.id`,
      [id],
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  let body: { status?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["new", "contacted", "quoted", "converted", "cancelled"];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE enquiries
       SET status = COALESCE($1, status),
           customer_note = COALESCE($2, customer_note),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, status, customer_note`,
      [body.status ?? null, body.notes ?? null, id],
    );

    await client.query(
      `INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [session.user.email ?? null, "update_enquiry", "enquiry", id, JSON.stringify(body)],
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } finally {
    client.release();
  }
}