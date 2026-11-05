import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getProductBySlug } from "@/lib/catalogue";

export const runtime = "nodejs";

type EnquiryItemInput = {
  productId?: string | null;
  key?: string;
  slug?: string;
  name: string;
  brand?: string | null;
  sku?: string | null;
  variantLabel?: string | null;
  attributes?: Record<string, unknown> | null;
  price?: number | string | null;
  priceStatus?: string | null;
  availability?: string | null;
  quantity: number;
  unit?: string;
  notes?: string | null;
  imageUrl?: string | null;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`enquiry:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const client = await pool.connect();

  try {
    const body = await request.json();

    if (body?.website) {
      return NextResponse.json({ error: "Spam detected." }, { status: 400 });
    }

    const rawCustomer =
      body?.customer && typeof body.customer === "object" ? body.customer : null;
    const items = body.items as EnquiryItemInput[];

    // Accept both the canonical `customer` object and the legacy flat fields so
    // older clients cannot silently fail validation.
    const name = String(rawCustomer?.name ?? body?.customerName ?? "").trim();
    const phone = String(rawCustomer?.phone ?? body?.customerMobile ?? "")
      .replace(/\D/g, "");
    const location = String(rawCustomer?.location ?? body?.deliveryLocation ?? "").trim();

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { error: "Please enter a valid customer name." },
        { status: 400 },
      );
    }

    if (phone.length < 10 || phone.length > 15) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { error: "Please add between 1 and 50 products." },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (
        typeof item.name !== "string" ||
        !item.name.trim() ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        Number(item.quantity) > 100000
      ) {
        return NextResponse.json(
          { error: "One or more product details are invalid." },
          { status: 400 },
        );
      }
    }

    await client.query("BEGIN");

    const customerResult = await client.query(
      `INSERT INTO customers (name, phone, location)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone)
       DO UPDATE SET
         name = EXCLUDED.name,
         location = EXCLUDED.location,
         updated_at = NOW()
       RETURNING id`,
      [name, phone, location || null],
    );

    const customerId = customerResult.rows[0].id;

    const enquiryResult = await client.query(
      `INSERT INTO enquiries (
        customer_id,
        customer_name,
        customer_phone,
        customer_location,
        customer_note,
        language
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, reference`,
      [
        customerId,
        name,
        phone,
        location || null,
        String(body.customerNote ?? "").slice(0, 2000) || null,
        body.language === "en" ? "en" : "hi",
      ],
    );

    const enquiry = enquiryResult.rows[0];

    for (const item of items) {
      // Treat browser-submitted prices as untrusted: prefer server-side catalogue data.
      let resolvedName = item.name.trim();
      let resolvedBrand = item.brand ?? null;
      let resolvedSku = item.sku ?? null;
      let resolvedPrice: number | null = null;
      let resolvedPriceStatus = item.priceStatus ?? null;
      let resolvedAvailability = item.availability ?? null;

      if (item.slug) {
        const product = await getProductBySlug(item.slug);
        if (product) {
          resolvedName = product.name;
          resolvedBrand = product.brand?.name ?? resolvedBrand;
          resolvedSku = product.sku ?? resolvedSku;
          resolvedPrice = typeof product.price === "number" ? product.price : null;
          resolvedPriceStatus = product.priceStatus ?? resolvedPriceStatus;
          resolvedAvailability = product.availability ?? resolvedAvailability;
        }
      }

      const rawPrice = resolvedPrice !== null ? resolvedPrice : item.price;
      const price =
        rawPrice === null || rawPrice === undefined || rawPrice === ""
          ? null
          : Number(rawPrice);

      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        throw new Error("Invalid product price.");
      }

      await client.query(
        `INSERT INTO enquiry_items (
          enquiry_id,
          product_id,
          product_slug,
          product_name,
          brand,
          sku,
          variant_label,
          attributes,
          price,
          price_status,
          availability,
          quantity,
          unit,
          notes,
          image_url
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15
        )`,
        [
          enquiry.id,
          item.productId ?? null,
          item.slug ?? null,
          resolvedName,
          resolvedBrand,
          resolvedSku,
          item.variantLabel ?? null,
          JSON.stringify(item.attributes ?? {}),
          price,
          resolvedPriceStatus,
          resolvedAvailability,
          Number(item.quantity),
          item.unit ?? "piece",
          item.notes ?? null,
          item.imageUrl ?? null,
        ],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        id: enquiry.id,
        reference: enquiry.reference,
      },
      { status: 201 },
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Enquiry creation failed:", error);

    return NextResponse.json(
      { error: "Unable to save your enquiry. Please try again." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}