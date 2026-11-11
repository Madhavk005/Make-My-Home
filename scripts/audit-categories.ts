/**
 * Read-only category audit. Produces a JSON report describing the current
 * Sanity category hierarchy, product assignments and data-quality issues.
 *
 *   npx tsx scripts/audit-categories.ts [output.json]
 *
 * No documents are modified.
 */
import { config as loadDotenv } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";

loadDotenv({ path: [".env.local", ".env"] });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_READ_TOKEN?.trim() || process.env.SANITY_API_WRITE_TOKEN?.trim();

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01",
  useCdn: false,
  perspective: "raw",
  token,
});

type CategoryRow = {
  _id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  stage: string | null;
  order: number | null;
  hasImage: boolean;
  updatedAt: string;
};

type ProductRow = {
  _id: string;
  name: string;
  slug: string | null;
  sku: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  brandName: string | null;
  priceStatus: string | null;
  price: number | null;
  unit: string | null;
  imageCount: number;
  hasDescription: boolean;
  variantCount: number;
  availability: string | null;
};

async function main() {
  const [counts, categories, products, brands] = await Promise.all([
    client.fetch<Record<string, number>>(`{
      "categories": count(*[_type=="category" && !(_id in path("drafts.**"))]),
      "categoryDrafts": count(*[_type=="category" && _id in path("drafts.**")]),
      "products": count(*[_type=="product" && !(_id in path("drafts.**"))]),
      "productDrafts": count(*[_type=="product" && _id in path("drafts.**")]),
      "brands": count(*[_type=="brand" && !(_id in path("drafts.**"))]),
      "settings": count(*[_type=="siteSettings"])
    }`),
    client.fetch<CategoryRow[]>(`*[_type=="category" && !(_id in path("drafts.**"))] | order(order asc, name asc){
      _id, name, "slug": slug.current, "parentId": parent._ref, stage, order,
      "hasImage": defined(image.asset), "updatedAt": _updatedAt
    }`),
    client.fetch<ProductRow[]>(`*[_type=="product" && !(_id in path("drafts.**"))] | order(name asc){
      _id, name, "slug": slug.current, sku, "categoryId": category._ref, "categoryName": category->name,
      "categorySlug": category->slug.current, "brandName": brand->name, priceStatus, price,
      unit, "imageCount": count(images), "hasDescription": defined(description), "variantCount": count(variants),
      availability
    }`),
    client.fetch<Array<{ _id: string; name: string; slug: string | null }>>(
      `*[_type=="brand" && !(_id in path("drafts.**"))] | order(name asc){_id, name, "slug": slug.current}`,
    ),
  ]);

  const byId = new Map(categories.map((category) => [category._id, category]));
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = children.get(category.parentId) ?? [];
    list.push(category._id);
    children.set(category.parentId, list);
  }

  const depthOf = (id: string): number | null => {
    let depth = 0;
    let current = byId.get(id);
    const seen = new Set<string>();
    while (current?.parentId) {
      if (seen.has(current._id)) return null;
      seen.add(current._id);
      current = byId.get(current.parentId);
      if (!current) return null;
      depth += 1;
    }
    return depth;
  };

  const duplicateSlugs = new Map<string, string[]>();
  const duplicateNames = new Map<string, string[]>();
  for (const category of categories) {
    if (category.slug) {
      const key = category.slug.toLowerCase();
      duplicateSlugs.set(key, [...(duplicateSlugs.get(key) ?? []), category._id]);
    }
    const nameKey = category.name.trim().toLowerCase();
    duplicateNames.set(nameKey, [...(duplicateNames.get(nameKey) ?? []), category._id]);
  }

  const productCount = new Map<string, number>();
  for (const product of products) {
    if (!product.categoryId) continue;
    productCount.set(product.categoryId, (productCount.get(product.categoryId) ?? 0) + 1);
  }

  const directProductCounts = Object.fromEntries(productCount);
  const subtreeProductCount = (id: string): number => {
    let total = productCount.get(id) ?? 0;
    for (const child of children.get(id) ?? []) total += subtreeProductCount(child);
    return total;
  };

  const issues = {
    categoriesWithoutSlug: categories.filter((category) => !category.slug),
    categoriesWithMissingParent: categories.filter(
      (category) => category.parentId && !byId.has(category.parentId),
    ),
    duplicateSlugs: Array.from(duplicateSlugs.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([slug, ids]) => ({ slug, ids })),
    duplicateNames: Array.from(duplicateNames.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([name, ids]) => ({ name, ids })),
    cycles: categories
      .map((category) => ({ category, depth: depthOf(category._id) }))
      .filter((entry) => entry.depth === null)
      .map((entry) => entry.category),
    deepCategories: categories
      .map((category) => ({ category, depth: depthOf(category._id) }))
      .filter((entry) => typeof entry.depth === "number" && entry.depth > 2)
      .map((entry) => ({ ...entry.category, depth: entry.depth })),
    productsWithoutCategory: products.filter((product) => !product.categoryId),
    productsWithMissingCategory: products.filter(
      (product) => product.categoryId && !byId.has(product.categoryId),
    ),
    productsOnNonLeafCategory: products.filter((product) => {
      if (!product.categoryId) return false;
      return (children.get(product.categoryId) ?? []).length > 0;
    }),
  };

  const levels = { primary: 0, secondary: 0, tertiary: 0, deeper: 0, broken: 0 };
  for (const category of categories) {
    const depth = depthOf(category._id);
    if (depth === null) levels.broken += 1;
    else if (depth === 0) levels.primary += 1;
    else if (depth === 1) levels.secondary += 1;
    else if (depth === 2) levels.tertiary += 1;
    else levels.deeper += 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    projectId,
    dataset,
    counts,
    levels,
    categories: categories.map((category) => ({
      ...category,
      depth: depthOf(category._id),
      directProductCount: directProductCounts[category._id] ?? 0,
      subtreeProductCount: subtreeProductCount(category._id),
      childCount: (children.get(category._id) ?? []).length,
    })),
    products,
    brands,
    issues,
  };

  const output = process.argv[2] || "reports/category-audit.json";
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2));

  console.log(`Dataset: ${projectId}/${dataset}`);
  console.log(
    `Categories: ${counts.categories} (primary ${levels.primary}, secondary ${levels.secondary}, tertiary ${levels.tertiary}, deeper ${levels.deeper}, broken ${levels.broken})`,
  );
  console.log(`Products: ${counts.products}, brands: ${counts.brands}`);
  console.log(
    `Issues: ${issues.categoriesWithoutSlug.length} without slug, ${issues.duplicateSlugs.length} duplicate slug(s), ${issues.duplicateNames.length} duplicate name(s), ${issues.cycles.length} cycle(s), ${issues.productsWithoutCategory.length} product(s) without category, ${issues.productsOnNonLeafCategory.length} product(s) on a parent category`,
  );
  console.log(`Report written to ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
