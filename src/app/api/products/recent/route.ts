import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/catalogue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugs = (searchParams.get("slugs") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);

  const products = (await Promise.all(slugs.map((slug) => getProductBySlug(slug)))).filter(Boolean);
  return NextResponse.json({ products });
}
