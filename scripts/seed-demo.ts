/**
 * Optional demo catalogue.
 *
 * Creates a small, clearly marked demo taxonomy and product set. It never runs
 * automatically, never touches site settings, and every product has isDemo=true
 * so the storefront shows a "Demo" badge.
 *
 *   npm run seed:demo            # preview
 *   npm run seed:demo -- --commit
 *
 * Remove demo content from Sanity Studio using the "Sample / demo content" list
 * under Catalogue health.
 */

import { config as loadDotenv } from "dotenv";
import { createClient } from "@sanity/client";

loadDotenv({ path: [".env.local", ".env"] });

const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";
const commit = process.argv.includes("--commit");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

type DemoCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
};

type DemoBrand = { id: string; name: string; slug: string };

const categories: DemoCategory[] = [
  { id: "demo-category-cement", name: "Demo · Cement", slug: "demo-cement", parentId: null, order: 900 },
  { id: "demo-category-cement-opc", name: "Demo · OPC", slug: "demo-opc", parentId: "demo-category-cement", order: 901 },
  { id: "demo-category-electrical", name: "Demo · Electrical", slug: "demo-electrical", parentId: null, order: 910 },
  { id: "demo-category-wires", name: "Demo · Wires & Cables", slug: "demo-wires-cables", parentId: "demo-category-electrical", order: 911 },
  { id: "demo-category-tiles", name: "Demo · Tiles", slug: "demo-tiles", parentId: null, order: 920 },
];

const brands: DemoBrand[] = [
  { id: "demo-brand-a", name: "Demo Brand A", slug: "demo-brand-a" },
  { id: "demo-brand-b", name: "Demo Brand B", slug: "demo-brand-b" },
];

const products = [
  {
    _id: "demo-product-cement",
    name: "Demo OPC Cement 53 Grade",
    slug: "demo-opc-cement-53-grade",
    sku: "DEMO-CEM-001",
    categoryId: "demo-category-cement-opc",
    brandId: "demo-brand-a",
    shortDescription: "Sample row used to test the catalogue. Not a real product or price.",
    unit: "bag",
    priceStatus: "fixed",
    price: 410,
    availability: "available",
    specifications: [
      { name: "Grade", value: "OPC 53 (demo)" },
      { name: "Pack size", value: "50 kg (demo)" },
    ],
    variants: [] as Array<Record<string, unknown>>,
  },
  {
    _id: "demo-product-wire",
    name: "Demo FR PVC Wire",
    slug: "demo-fr-pvc-wire",
    sku: "DEMO-ELE-001",
    categoryId: "demo-category-wires",
    brandId: "demo-brand-a",
    shortDescription: "Sample product with variants. Not a real product or price.",
    unit: "metre",
    priceStatus: "on_request",
    price: null,
    availability: "on_request",
    specifications: [
      { name: "Conductor", value: "Copper (demo)" },
      { name: "Insulation", value: "FR PVC (demo)" },
    ],
    variants: [
      {
        _type: "productVariant",
        _key: "variant-1",
        label: "1.5 sq mm · Red (demo)",
        sku: "DEMO-ELE-001-15-RED",
        attributes: [
          { _type: "variantAttribute", _key: "attribute-1", name: "Size", value: "1.5 sq mm" },
          { _type: "variantAttribute", _key: "attribute-2", name: "Colour", value: "Red" },
        ],
        price: 28,
        priceStatus: "fixed",
        unit: "metre",
        availability: "available",
      },
      {
        _type: "productVariant",
        _key: "variant-2",
        label: "2.5 sq mm · Red (demo)",
        sku: "DEMO-ELE-001-25-RED",
        attributes: [
          { _type: "variantAttribute", _key: "attribute-1", name: "Size", value: "2.5 sq mm" },
          { _type: "variantAttribute", _key: "attribute-2", name: "Colour", value: "Red" },
        ],
        price: 42,
        priceStatus: "fixed",
        unit: "metre",
        availability: "available",
      },
    ],
  },
  {
    _id: "demo-product-tile",
    name: "Demo Vitrified Floor Tile",
    slug: "demo-vitrified-floor-tile",
    sku: "DEMO-TIL-001",
    categoryId: "demo-category-tiles",
    brandId: "demo-brand-b",
    shortDescription: "Sample row used to test the catalogue. Not a real product or price.",
    unit: "square metre",
    priceStatus: "not_supplied",
    price: null,
    availability: "not_confirmed",
    specifications: [
      { name: "Material", value: "Vitrified (demo)" },
      { name: "Finish", value: "Matt (demo)" },
    ],
    variants: [] as Array<Record<string, unknown>>,
  },
];

async function main() {
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is missing. Set it in .env.local first.");
  }
  if (commit && !token) {
    throw new Error("SANITY_API_WRITE_TOKEN is required for --commit.");
  }

  console.log("");
  console.log(`Demo seed — ${commit ? "COMMIT" : "PREVIEW"}`);
  console.log(`  Dataset: ${projectId}/${dataset}`);
  console.log(`  ${categories.length} categories, ${brands.length} brands, ${products.length} products`);
  console.log("  All products are marked isDemo=true and use obvious demo names/prices.");
  console.log("  Site settings are not touched.");
  console.log("");

  if (!commit) {
    console.log("Nothing was written. Re-run with --commit to create the demo content.");
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
  });

  for (const category of categories) {
    await client.createOrReplace({
      _id: category.id,
      _type: "category",
      name: category.name,
      slug: { _type: "slug", current: category.slug },
      order: category.order,
      ...(category.parentId
        ? { parent: { _type: "reference", _ref: category.parentId } }
        : {}),
    });
    console.log(`✓ category ${category.name}`);
  }

  for (const brand of brands) {
    await client.createOrReplace({
      _id: brand.id,
      _type: "brand",
      name: brand.name,
      slug: { _type: "slug", current: brand.slug },
      order: 900,
    });
    console.log(`✓ brand ${brand.name}`);
  }

  for (const product of products) {
    await client.createOrReplace({
      _id: product._id,
      _type: "product",
      name: product.name,
      slug: { _type: "slug", current: product.slug },
      sku: product.sku,
      category: { _type: "reference", _ref: product.categoryId },
      brand: { _type: "reference", _ref: product.brandId },
      shortDescription: product.shortDescription,
      unit: product.unit,
      priceStatus: product.priceStatus,
      ...(product.price !== null ? { price: product.price } : {}),
      availability: product.availability,
      specifications: product.specifications.map((spec, index) => ({
        _type: "specification",
        _key: `spec-${index + 1}`,
        ...spec,
      })),
      variants: product.variants,
      featured: false,
      isDemo: true,
    });
    console.log(`✓ product ${product.name}`);
  }

  console.log("");
  console.log("Demo content created. Remove it via Studio → Catalogue health → Sample / demo content.");
}

main().catch((error) => {
  console.error("");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
