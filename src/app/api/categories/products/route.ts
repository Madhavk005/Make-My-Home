import { NextResponse } from "next/server";
import { getCatalogue, getCategoryPageData, getProductList } from "@/lib/catalogue";
import { categoryHref, categoryPathFor, findCategoryBySlug } from "@/lib/categories";
import { PAGE_SIZE, parseFilters, type CatalogFilters } from "@/lib/filters";
import type { CatalogQueryInput } from "@/lib/queries";

export const runtime = "nodejs";

function searchParamsRecord(searchParams: URLSearchParams): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    record[key] = values.length > 1 ? values : values[0];
  }
  return record;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get("path")?.trim();
  const requestedSlug = searchParams.get("slug")?.trim();

  if (!requestedPath && !requestedSlug) {
    return NextResponse.json({ error: "Provide path or slug." }, { status: 400 });
  }

  let slugPath = (requestedPath ?? requestedSlug ?? "").split("/").filter(Boolean);

  if (!requestedPath && requestedSlug) {
    const catalogue = await getCatalogue();
    const match = findCategoryBySlug(catalogue.categories, requestedSlug);
    if (!match) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    slugPath = categoryPathFor(catalogue.categories, match._id);
  }

  const data = await getCategoryPageData(slugPath);
  if (!data) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const parsed = parseFilters(searchParamsRecord(searchParams));
  const filters: CatalogFilters = { ...parsed, category: "" };
  const pageSize = PAGE_SIZE;

  const input: CatalogQueryInput = {
    categoryIds: data.categoryIds,
    q: filters.q || null,
    brandSlugs: filters.brands,
    availability: filters.availability,
    minPrice: filters.min ?? null,
    maxPrice: filters.max ?? null,
    specs: filters.specs,
    sort: filters.sort,
    page: filters.page,
    pageSize,
  };

  const result = await getProductList(input);

  return NextResponse.json({
    category: {
      id: data.category._id,
      name: data.category.name,
      slug: data.category.slug,
      level: data.category.level,
      path: data.category.path,
      href: categoryHref(data.category.path),
      description: data.category.description ?? null,
    },
    breadcrumb: data.breadcrumb.map((item) => ({
      id: item._id,
      name: item.name,
      path: item.path,
      href: categoryHref(item.path),
    })),
    products: result.items,
    total: result.total,
    page: filters.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
  });
}
