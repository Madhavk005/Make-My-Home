import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sanityWriteClient, isSanityWriteConfigured } from "@/lib/sanity-write";
import { sanityFetch, isSanityConfigured } from "@/lib/sanity";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSanityConfigured) {
    return NextResponse.json({ error: "Sanity not configured." }, { status: 503 });
  }

  const { id } = await params;
  const product = await sanityFetch<any>({ query: `*[_id == $id][0]{_id,name,price,availability,featured}`, params: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSanityWriteConfigured || !sanityWriteClient) {
    return NextResponse.json({ error: "Sanity write token not configured." }, { status: 503 });
  }

  const { id } = await params;
  let body: { price?: number; availability?: string; featured?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch = sanityWriteClient.patch(id);
  if (typeof body.price === "number") patch.set({ price: body.price });
  if (body.availability) patch.set({ availability: body.availability });
  if (typeof body.featured === "boolean") patch.set({ featured: body.featured });

  try {
    const result = await patch.commit();
    return NextResponse.json({ ok: true, id: result._id });
  } catch (error) {
    console.error("Product update failed", error);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}
