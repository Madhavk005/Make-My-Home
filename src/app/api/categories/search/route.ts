import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/catalogue";
import { categoryHref, flattenCategoryTree } from "@/lib/categories";
import { searchCategoryRecords } from "@/lib/category-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`category-search:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);

  const { tree } = await getCatalogue();
  const all = flattenCategoryTree(tree);
  const nameById = new Map(all.map((category) => [category._id, category.name]));
  const matches = query ? searchCategoryRecords(all, query) : all;

  const results = matches
    .sort((a, b) => {
      if (!query) {
        return a.level.localeCompare(b.level) || b.productCount - a.productCount;
      }
      const needle = query.toLowerCase();
      const exactA = a.name.toLowerCase() === needle ? 0 : 1;
      const exactB = b.name.toLowerCase() === needle ? 0 : 1;
      return (
        exactA - exactB ||
        a.depth - b.depth ||
        b.productCount - a.productCount ||
        a.name.localeCompare(b.name)
      );
    })
    .slice(0, limit)
    .map((category) => ({
      id: category._id,
      name: category.name,
      slug: category.slug,
      level: category.level,
      path: category.path,
      href: categoryHref(category.path),
      productCount: category.productCount,
      parentName: category.parentId ? nameById.get(category.parentId) ?? null : null,
    }));

  return NextResponse.json(
    { query, count: results.length, results },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
  );
}
