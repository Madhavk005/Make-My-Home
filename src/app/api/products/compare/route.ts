import { NextResponse } from "next/server";
import { getProductBySlug, getProductList } from "@/lib/catalogue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const list = await getProductList({ sort: "recommended", page: 1, pageSize: 1000 });
  const byId = new Map(list.items.map((product) => [product._id, product]));
  const products = ids
    .map((id) => byId.get(id))
    .filter(Boolean);

  // Enrich with details for specifications/variants.
  const details = await Promise.all(
    products.map(async (product) => {
      const detail = await getProductBySlug(product!.slug);
      return detail ?? product;
    }),
  );

  return NextResponse.json({ products: details });
}
