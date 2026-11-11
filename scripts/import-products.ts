/**
 * Bulk product import for the Make My Home catalogue.
 *
 * Safety model:
 *   - Dry-run by default. Nothing is written unless --commit is passed.
 *   - Existing SKUs are never overwritten unless --update-existing is passed.
 *   - Missing products are never created unless --create-missing is passed.
 *   - Every row is validated first and reported, including rows that fail.
 *   - Images are only uploaded when --upload-images is passed.
 *
 * Usage:
 *   npm run import:products -- --file samples/products.csv --variants samples/variants.csv
 *   npm run import:products -- --file products.csv --commit --create-missing
 *   npm run import:products -- --file products.csv --commit --update-existing --upload-images
 */

import { config as loadDotenv } from "dotenv";
import { parse } from "csv-parse/sync";
import { createClient, type SanityClient } from "@sanity/client";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

loadDotenv({ path: [".env.local", ".env"] });

const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";

type Args = {
  file: string;
  variants: string | null;
  commit: boolean;
  createMissing: boolean;
  updateExisting: boolean;
  uploadImages: boolean;
  report: string;
};

type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive?: boolean | null;
  specificationTemplate?: string[] | null;
};

type BrandRow = {
  _id: string;
  name: string;
  slug: string;
};

type ExistingProduct = {
  _id: string;
  sku: string;
  slug: string | null;
};

type ParsedSpec = { name: string; value: string; group?: string };

type ParsedVariant = {
  label: string;
  sku: string | null;
  attributes: Array<{ name: string; value: string }>;
  price: number | null;
  priceStatus: PriceStatus | null;
  unit: string | null;
  availability: Availability | null;
  imageUrl: string | null;
};

type PriceStatus = "fixed" | "on_request" | "not_supplied";
type Availability = "available" | "on_request" | "unavailable" | "not_confirmed";

type PlanAction = "create" | "update" | "skip-exists" | "skip-missing" | "invalid";

type RowPlan = {
  row: number;
  sku: string;
  name: string;
  action: PlanAction;
  errors: string[];
  warnings: string[];
  fields: Record<string, unknown> | null;
  existingId: string | null;
  imagesToUpload: string[];
  variantImageSlots: Array<{ index: number; url: string }>;
};

type VariantPlan = {
  row: number;
  productSku: string;
  variant: ParsedVariant;
  errors: string[];
  warnings: string[];
};

type ReportRow = {
  row: number;
  sku: string;
  name: string;
  action: PlanAction;
  result: "pending" | "written" | "skipped" | "failed";
  errors: string[];
  warnings: string[];
};

const PRICE_STATUSES = new Set<PriceStatus>(["fixed", "on_request", "not_supplied"]);
const AVAILABILITIES = new Set<Availability>([
  "available",
  "on_request",
  "unavailable",
  "not_confirmed",
]);

function printHelp() {
  console.log(`Make My Home — product import

Options:
  --file <path>            Products CSV (default: products.csv)
  --variants <path>        Optional variants CSV (default: variants.csv when present)
  --commit                 Actually write to Sanity (default is a dry run)
  --create-missing         Create products whose SKU is not in Sanity
  --update-existing        Update products whose SKU already exists
  --upload-images          Download and upload image URLs to Sanity
  --report <path>          Report path (default: import-report.json)
  --help                   Show this message

The CSV column reference and validation rules are documented in README.md.`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    file: "products.csv",
    variants: null,
    commit: false,
    createMissing: false,
    updateExisting: false,
    uploadImages: false,
    report: "import-report.json",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const eqIndex = raw.indexOf("=");
    const flag = eqIndex === -1 ? raw : raw.slice(0, eqIndex);
    const inlineValue = eqIndex === -1 ? undefined : raw.slice(eqIndex + 1);

    const takeValue = (): string => {
      if (inlineValue !== undefined) return inlineValue;
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for ${flag}`);
      }
      index += 1;
      return next;
    };

    switch (flag) {
      case "--file":
        args.file = takeValue();
        break;
      case "--variants":
        args.variants = takeValue();
        break;
      case "--report":
        args.report = takeValue();
        break;
      case "--commit":
        args.commit = true;
        break;
      case "--create-missing":
        args.createMissing = true;
        break;
      case "--update-existing":
        args.updateExisting = true;
        break;
      case "--upload-images":
        args.uploadImages = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${raw}. Use --help for usage.`);
    }
  }

  return args;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readCell(row: Record<string, string>, ...names: string[]): string {
  for (const name of names) {
    const value = row[normalizeHeader(name)];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function hasColumn(row: Record<string, string>, ...names: string[]): boolean {
  return names.some((name) => Object.prototype.hasOwnProperty.call(row, normalizeHeader(name)));
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const cleaned = value.replace(/[₹,\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return null;
}

function splitList(value: string): string[] {
  return value
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(value: string): { specs: ParsedSpec[]; errors: string[] } {
  const specs: ParsedSpec[] = [];
  const errors: string[] = [];

  for (const item of splitList(value)) {
    const separator = item.indexOf(":");
    if (separator < 1) {
      errors.push(`Specification "${item}" must look like "Key: Value".`);
      continue;
    }
    let name = item.slice(0, separator).trim();
    const specValue = item.slice(separator + 1).trim();
    let group: string | undefined;

    const groupMatch = name.match(/^\[(.+?)\]\s*(.+)$/);
    if (groupMatch) {
      group = groupMatch[1].trim();
      name = groupMatch[2].trim();
    }

    if (!name || !specValue) {
      errors.push(`Specification "${item}" needs both a name and a value.`);
      continue;
    }
    if (name.length > 80 || specValue.length > 160) {
      errors.push(`Specification "${name}" is too long (name ≤ 80, value ≤ 160).`);
      continue;
    }
    specs.push(group ? { name, value: specValue, group } : { name, value: specValue });
  }

  return { specs, errors };
}

function parseAttributes(value: string): { attributes: Array<{ name: string; value: string }>; errors: string[] } {
  const attributes: Array<{ name: string; value: string }> = [];
  const errors: string[] = [];

  for (const item of splitList(value)) {
    const separator = item.indexOf(":");
    if (separator < 1) {
      errors.push(`Variant attribute "${item}" must look like "Name: Value".`);
      continue;
    }
    const name = item.slice(0, separator).trim();
    const attributeValue = item.slice(separator + 1).trim();
    if (!name || !attributeValue) {
      errors.push(`Variant attribute "${item}" needs both a name and a value.`);
      continue;
    }
    attributes.push({ name, value: attributeValue });
  }

  return { attributes, errors };
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function portableText(value: string): Array<Record<string, unknown>> {
  const paragraphs = value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => ({
    _type: "block",
    _key: `p-${index + 1}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `s-${index + 1}`,
        text: paragraph,
        marks: [],
      },
    ],
  }));
}

function buildCategoryPaths(categories: CategoryRow[]) {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const cache = new Map<string, { names: string[]; slugs: string[] } | null>();

  const resolve = (id: string, seen = new Set<string>()): { names: string[]; slugs: string[] } | null => {
    if (cache.has(id)) return cache.get(id) ?? null;
    if (seen.has(id)) return null;
    seen.add(id);

    const category = byId.get(id);
    if (!category) return null;

    if (!category.parentId) {
      const result = { names: [category.name], slugs: [category.slug] };
      cache.set(id, result);
      return result;
    }

    const parent = resolve(category.parentId, seen);
    if (!parent) {
      cache.set(id, null);
      return null;
    }
    const result = {
      names: [...parent.names, category.name],
      slugs: [...parent.slugs, category.slug],
    };
    cache.set(id, result);
    return result;
  };

  for (const category of categories) resolve(category._id);

  return {
    byId,
    resolve: (id: string) => resolve(id),
    find(input: string): CategoryRow | null {
      const trimmed = input.trim();
      if (!trimmed) return null;

      if (trimmed.includes(">")) {
        const names = trimmed.split(">").map((part) => part.trim().toLowerCase());
        for (const category of categories) {
          const path = resolve(category._id);
          if (
            path &&
            path.names.length === names.length &&
            path.names.every((name, index) => name.toLowerCase() === names[index])
          ) {
            return category;
          }
        }
        return null;
      }

      if (trimmed.includes("/")) {
        const slugs = trimmed.split("/").map((part) => part.trim().toLowerCase());
        for (const category of categories) {
          const path = resolve(category._id);
          if (
            path &&
            path.slugs.length === slugs.length &&
            path.slugs.every((slug, index) => slug.toLowerCase() === slugs[index])
          ) {
            return category;
          }
        }
        return null;
      }

      const lowered = trimmed.toLowerCase();
      const bySlug = categories.filter((category) => category.slug.toLowerCase() === lowered);
      if (bySlug.length === 1) return bySlug[0];

      const byName = categories.filter((category) => category.name.toLowerCase() === lowered);
      if (byName.length === 1) return byName[0];

      return null;
    },
  };
}

async function fetchCatalog(client: SanityClient) {
  const [categories, brands, products] = await Promise.all([
    client.fetch<CategoryRow[]>(
      `*[_type == "category"]{_id, name, "slug": slug.current, "parentId": parent._ref, isActive, specificationTemplate}`,
    ),
    client.fetch<BrandRow[]>(`*[_type == "brand"]{_id, name, "slug": slug.current}`),
    client.fetch<ExistingProduct[]>(
      `*[_type == "product"]{_id, sku, "slug": slug.current}`,
    ),
  ]);

  return { categories, brands, products };
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}) for ${url}`);
  }
  const contentType = response.headers.get("content-type")?.split(";")[0].trim() || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`URL is not an image (${contentType || "unknown type"}): ${url}`);
  }
  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > 20 * 1024 * 1024) {
    throw new Error(`Image is larger than 20 MB: ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > 20 * 1024 * 1024) {
    throw new Error(`Image is larger than 20 MB: ${url}`);
  }
  const pathname = new URL(url).pathname;
  const filename = path.basename(pathname) || `image-${Date.now()}`;
  return { buffer, filename, contentType };
}

async function uploadImage(
  client: SanityClient,
  url: string,
  alt: string,
): Promise<Record<string, unknown>> {
  const { buffer, filename, contentType } = await downloadImage(url);
  const asset = await client.assets.upload("image", buffer, {
    filename,
    contentType,
    label: alt.slice(0, 120),
  });
  return {
    _type: "image",
    _key: filename.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60) || `image-${Date.now()}`,
    asset: { _type: "reference", _ref: asset._id },
    alt,
  };
}

function mergeVariantsIntoPlans(
  productPlans: RowPlan[],
  variantPlans: VariantPlan[],
): void {
  const bySku = new Map(productPlans.map((plan) => [plan.sku.toLowerCase(), plan]));
  const grouped = new Map<string, VariantPlan[]>();

  for (const variantPlan of variantPlans) {
    const key = variantPlan.productSku.toLowerCase();
    const list = grouped.get(key) ?? [];
    list.push(variantPlan);
    grouped.set(key, list);
  }

  for (const [key, list] of grouped) {
    const plan = bySku.get(key);
    if (!plan) {
      for (const variantPlan of list) {
        variantPlan.errors.push(
          `Variant row references product SKU "${variantPlan.productSku}", which is not in the products CSV.`,
        );
      }
      continue;
    }

    if (plan.action === "skip-missing" || plan.action === "skip-exists") {
      plan.warnings.push(
        `${list.length} variant row(s) were not applied because the product is being skipped.`,
      );
      continue;
    }

    if (plan.action === "invalid" || !plan.fields) continue;

    const variants: Array<Record<string, unknown>> = [];
    const seenVariantSkus = new Set<string>();

    list.forEach((variantPlan, index) => {
      if (variantPlan.errors.length > 0) {
        plan.errors.push(...variantPlan.errors.map((error) => `Variant: ${error}`));
        return;
      }

      const variant = variantPlan.variant;
      if (variant.sku) {
        const normalized = variant.sku.toLowerCase();
        if (seenVariantSkus.has(normalized)) {
          plan.errors.push(`Variant SKU "${variant.sku}" appears more than once in this file.`);
          return;
        }
        seenVariantSkus.add(normalized);
      }

      const attributes = variant.attributes.map((attribute, attributeIndex) => ({
        _type: "variantAttribute",
        _key: `attribute-${index + 1}-${attributeIndex + 1}`,
        name: attribute.name,
        value: attribute.value,
      }));

      const variantIndex = variants.length;
      variants.push({
        _type: "productVariant",
        _key: `variant-${index + 1}`,
        label: variant.label,
        ...(variant.sku ? { sku: variant.sku } : {}),
        attributes,
        ...(variant.price !== null ? { price: variant.price } : {}),
        ...(variant.priceStatus ? { priceStatus: variant.priceStatus } : {}),
        ...(variant.unit ? { unit: variant.unit } : {}),
        ...(variant.availability ? { availability: variant.availability } : {}),
      });

      if (variant.imageUrl) {
        plan.variantImageSlots.push({ index: variantIndex, url: variant.imageUrl });
      }
    });

    if (plan.errors.length > 0) {
      plan.action = "invalid";
      continue;
    }

    plan.fields.variants = variants;
    plan.warnings.push(`Variants will replace the existing variants array (${variants.length} row(s)).`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();

  if (!projectId) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID is missing. Copy .env.example to .env.local and set the Sanity project.",
    );
  }
  if (args.commit && !token) {
    throw new Error("SANITY_API_WRITE_TOKEN is required for --commit.");
  }
  if (args.commit && !args.createMissing && !args.updateExisting) {
    throw new Error(
      "--commit needs --create-missing and/or --update-existing so the intent is explicit.",
    );
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: API_VERSION,
    token: token || undefined,
    useCdn: false,
    perspective: "published",
  });

  const productText = await readFile(path.resolve(args.file), "utf8");
  const productRecords = parse(productText, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: false,
  }) as Array<Record<string, string>>;

  if (productRecords.length === 0) {
    throw new Error(`No data rows found in ${args.file}.`);
  }

  let variantRecords: Array<Record<string, string>> = [];
  let variantsPath = args.variants;
  if (!variantsPath) {
    const candidate = path.resolve("variants.csv");
    try {
      await readFile(candidate, "utf8");
      variantsPath = candidate;
    } catch {
      variantsPath = null;
    }
  }
  if (variantsPath) {
    const variantText = await readFile(path.resolve(variantsPath), "utf8");
    variantRecords = parse(variantText, {
      columns: (header: string[]) => header.map(normalizeHeader),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    }) as Array<Record<string, string>>;
  }

  const { categories, brands, products } = await fetchCatalog(client);
  const categoryIndex = buildCategoryPaths(categories);

  const existingBySku = new Map(products.map((product) => [product.sku.toLowerCase(), product]));
  const existingSlugs = new Map(
    products
      .filter((product) => product.slug)
      .map((product) => [(product.slug as string).toLowerCase(), product]),
  );

  const brandByName = new Map(brands.map((brand) => [brand.name.toLowerCase(), brand]));
  const brandBySlug = new Map(brands.map((brand) => [brand.slug.toLowerCase(), brand]));

  const seenSkus = new Set<string>();
  const seenSlugs = new Map<string, number>();

  const plans: RowPlan[] = productRecords.map((row, index) => {
    const rowNumber = index + 2;
    const sku = readCell(row, "sku", "product code", "product sku", "code");
    const name = readCell(row, "name", "product name", "title");
    const errors: string[] = [];
    const warnings: string[] = [];
    const fields: Record<string, unknown> = {};

    const plan: RowPlan = {
      row: rowNumber,
      sku,
      name,
      action: "invalid",
      errors,
      warnings,
      fields,
      existingId: null,
      imagesToUpload: [],
      variantImageSlots: [],
    };

    if (!sku) {
      errors.push("SKU is required.");
    } else if (sku.length > 80) {
      errors.push("SKU must be 80 characters or fewer.");
    } else if (seenSkus.has(sku.toLowerCase())) {
      errors.push(`Duplicate SKU "${sku}" in this file.`);
    } else {
      seenSkus.add(sku.toLowerCase());
    }

    if (!name) {
      errors.push("Product name is required.");
    } else if (name.length < 2 || name.length > 160) {
      errors.push("Product name must be between 2 and 160 characters.");
    }

    const slugInput = readCell(row, "slug");
    const slug = slugInput ? slugify(slugInput) : slugify(name);
    if (!slug) {
      errors.push("A URL slug could not be generated. Add a slug column value.");
    } else if (slugInput && slug !== slugInput.toLowerCase()) {
      warnings.push(`Slug "${slugInput}" was normalised to "${slug}".`);
    }
    if (slug) {
      const existingSlugRow = seenSlugs.get(slug);
      if (existingSlugRow) {
        errors.push(`Slug "${slug}" is also used by row ${existingSlugRow}.`);
      } else {
        seenSlugs.set(slug, rowNumber);
      }
      const clash = existingSlugs.get(slug);
      if (clash && clash.sku.toLowerCase() !== sku.toLowerCase()) {
        errors.push(`Slug "${slug}" is already used by product ${clash.sku}.`);
      }
    }

    const categoryInput = readCell(row, "category", "category path", "section");
    let categoryId: string | null = null;
    let resolvedCategory: CategoryRow | null = null;
    if (!categoryInput) {
      errors.push(
        "Category is required (use the full three-level path, e.g. 'Construction > Cement > OPC Cement').",
      );
    } else {
      const category = categoryIndex.find(categoryInput);
      const path = category ? categoryIndex.resolve(category._id) : null;

      if (!category) {
        errors.push(
          `Category "${categoryInput}" was not found. Create it in Sanity Studio first, or use the full three-level path.`,
        );
      } else if (!path || path.names.length !== 3) {
        errors.push(
          `Category "${categoryInput}" is not a tertiary category. Products must be assigned to primary → secondary → tertiary.`,
        );
      } else if (category.isActive === false) {
        errors.push(`Category "${categoryInput}" is inactive. Reactivate it before importing products.`);
      } else {
        categoryId = category._id;
        resolvedCategory = category;
      }
    }

    const brandInput = readCell(row, "brand", "brand name");
    let brandId: string | null = null;
    if (brandInput) {
      const brand =
        brandByName.get(brandInput.toLowerCase()) ?? brandBySlug.get(brandInput.toLowerCase());
      if (!brand) {
        errors.push(`Brand "${brandInput}" was not found. Create the brand in Sanity Studio first.`);
      } else {
        brandId = brand._id;
      }
    }

    const unit = readCell(row, "unit", "selling unit", "uom");
    if (!unit) {
      errors.push("Selling unit is required (for example: piece, metre, kg, bag).");
    } else if (unit.length > 40) {
      errors.push("Selling unit must be 40 characters or fewer.");
    }

    const priceValue = parseNumber(readCell(row, "price", "rate", "mrp"));
    const rawPriceStatus = readCell(row, "pricestatus", "price status").toLowerCase();
    let priceStatus: PriceStatus = "not_supplied";
    if (rawPriceStatus) {
      if (!PRICE_STATUSES.has(rawPriceStatus as PriceStatus)) {
        errors.push(`priceStatus must be fixed, on_request or not_supplied (got "${rawPriceStatus}").`);
      } else {
        priceStatus = rawPriceStatus as PriceStatus;
      }
    } else if (priceValue !== null) {
      priceStatus = "fixed";
      warnings.push("priceStatus was blank, so it was inferred as fixed from the supplied price.");
    }

    if (priceValue !== null && priceValue < 0) {
      errors.push("Price cannot be negative.");
    }
    if (priceStatus === "fixed" && (priceValue === null || priceValue <= 0)) {
      errors.push("A fixed price must be a number greater than zero.");
    }
    if (priceStatus !== "fixed" && priceValue !== null) {
      errors.push(
        `A price is set but priceStatus is "${priceStatus}". Remove the price or set priceStatus to fixed.`,
      );
    }

    const originalPrice = parseNumber(readCell(row, "originalprice", "list price", "mrp"));
    if (originalPrice !== null && originalPrice < 0) {
      errors.push("Original price cannot be negative.");
    }

    const rawAvailability = readCell(row, "availability", "stock status").toLowerCase();
    let availability: Availability = "not_confirmed";
    if (rawAvailability) {
      if (!AVAILABILITIES.has(rawAvailability as Availability)) {
        errors.push(
          `availability must be available, on_request, unavailable or not_confirmed (got "${rawAvailability}").`,
        );
      } else {
        availability = rawAvailability as Availability;
      }
    }

    const featuredValue = parseBoolean(readCell(row, "featured", "feature"));
    if (featuredValue === null && readCell(row, "featured", "feature")) {
      errors.push('featured must be true or false (or blank).');
    }

    const demoValue = parseBoolean(readCell(row, "isdemo", "demo"));
    if (demoValue === null && readCell(row, "isdemo", "demo")) {
      errors.push('isDemo must be true or false (or blank).');
    }

    const keywords = splitList(readCell(row, "keywords", "aliases", "search aliases"));

    const { specs, errors: specErrors } = parseSpecifications(
      readCell(row, "specifications", "specs"),
    );
    errors.push(...specErrors);

    // Category-specific guidance only. The importer never invents a value, and
    // missing suggestions are warnings so a legitimate product can still import.
    const template = resolvedCategory?.specificationTemplate ?? [];
    if (template.length > 0) {
      const supplied = new Set(specs.map((spec) => spec.name.trim().toLowerCase()));
      const missing = template.filter((name) => !supplied.has(name.trim().toLowerCase()));
      if (missing.length > 0) {
        warnings.push(
          `Category "${resolvedCategory?.name}" suggests these specification names: ${missing.join(
            ", ",
          )}. Add them only when the business has confirmed the values.`,
        );
      }
    }

    const imageUrls = splitList(readCell(row, "imageurls", "images", "image urls"));
    for (const url of imageUrls) {
      if (!/^https?:\/\//i.test(url)) {
        errors.push(`Image URL must start with http(s): ${url}`);
      }
    }
    if (imageUrls.length > 0 && !args.uploadImages) {
      warnings.push(
        `${imageUrls.length} image URL(s) will be ignored. Re-run with --upload-images to upload them.`,
      );
    }
    if (imageUrls.length > 8) {
      errors.push("A product can have at most 8 images.");
    }

    const shortDescription = readCell(row, "shortdescription", "short description", "summary");
    if (shortDescription.length > 240) {
      errors.push("Short description must be 240 characters or fewer.");
    }

    const description = readCell(row, "description", "long description", "details");

    if (errors.length > 0) {
      return plan;
    }

    plan.existingId = existingBySku.get(sku.toLowerCase())?._id ?? null;

    if (plan.existingId) {
      plan.action = args.updateExisting ? "update" : "skip-exists";
      if (!args.updateExisting) {
        plan.warnings.push(
          `SKU already exists (${plan.existingId}). Skipped because --update-existing was not passed.`,
        );
      }
    } else {
      plan.action = args.createMissing ? "create" : "skip-missing";
      if (!args.createMissing) {
        plan.warnings.push("SKU is new. Skipped because --create-missing was not passed.");
      }
    }

    plan.fields = {
      _type: "product",
      name,
      slug: { _type: "slug", current: slug },
      sku,
      category: { _type: "reference", _ref: categoryId },
      ...(brandId ? { brand: { _type: "reference", _ref: brandId } } : {}),
      ...(shortDescription || hasColumn(row, "shortdescription", "short description", "summary")
        ? { shortDescription }
        : {}),
      ...(description || hasColumn(row, "description", "long description", "details")
        ? { description: description ? portableText(description) : [] }
        : {}),
      unit,
      priceStatus,
      ...(priceValue !== null
        ? { price: priceValue }
        : hasColumn(row, "price", "rate", "mrp")
          ? { price: null }
          : {}),
      ...(originalPrice !== null
        ? { originalPrice }
        : hasColumn(row, "originalprice", "list price", "mrp")
          ? { originalPrice: null }
          : {}),
      ...(hasColumn(row, "availability", "stock status") ? { availability } : {}),
      ...(featuredValue !== null ? { featured: featuredValue } : {}),
      ...(demoValue !== null ? { isDemo: demoValue } : {}),
      ...(keywords.length > 0 || hasColumn(row, "keywords", "aliases", "search aliases")
        ? { keywords }
        : {}),
      ...(specs.length > 0 || hasColumn(row, "specifications", "specs")
        ? {
            specifications: specs.map((spec, specIndex) => ({
              _type: "specification",
              _key: `spec-${specIndex + 1}`,
              name: spec.name,
              value: spec.value,
              ...(spec.group ? { group: spec.group } : {}),
            })),
          }
        : {}),
    };

    plan.imagesToUpload = imageUrls;

    return plan;
  });

  const variantPlans: VariantPlan[] = variantRecords.map((row, index) => {
    const rowNumber = index + 2;
    const productSku = readCell(row, "productsku", "product sku", "parent sku", "sku");
    const label = readCell(row, "variantlabel", "variant label", "label", "variant");
    const variantSku = readCell(row, "variantsku", "variant sku", "sku");
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!productSku) errors.push("productSku is required.");
    if (!label) {
      errors.push("variantLabel is required.");
    } else if (label.length > 120) {
      errors.push("variantLabel must be 120 characters or fewer.");
    }

    const { attributes, errors: attributeErrors } = parseAttributes(
      readCell(row, "attributes", "variant attributes"),
    );
    errors.push(...attributeErrors);
    if (attributes.length === 0 && attributeErrors.length === 0) {
      errors.push("At least one variant attribute is required (for example 'Colour: Red').");
    }

    const price = parseNumber(readCell(row, "price", "rate"));
    const rawPriceStatus = readCell(row, "pricestatus", "price status").toLowerCase();
    let priceStatus: PriceStatus | null = null;
    if (rawPriceStatus) {
      if (!PRICE_STATUSES.has(rawPriceStatus as PriceStatus)) {
        errors.push(`Variant priceStatus must be fixed, on_request or not_supplied.`);
      } else {
        priceStatus = rawPriceStatus as PriceStatus;
      }
    } else if (price !== null) {
      priceStatus = "fixed";
      warnings.push("Variant priceStatus was blank, so it was inferred as fixed.");
    }
    if (price !== null && price < 0) errors.push("Variant price cannot be negative.");
    if (priceStatus === "fixed" && (price === null || price <= 0)) {
      errors.push("A fixed variant price must be greater than zero.");
    }
    if (priceStatus !== "fixed" && price !== null) {
      errors.push("A variant price is set but its priceStatus is not fixed.");
    }

    const unit = readCell(row, "unit", "selling unit");
    if (unit.length > 40) errors.push("Variant unit must be 40 characters or fewer.");

    const rawAvailability = readCell(row, "availability", "stock status").toLowerCase();
    let availability: Availability | null = null;
    if (rawAvailability) {
      if (!AVAILABILITIES.has(rawAvailability as Availability)) {
        errors.push("Variant availability must be available, on_request, unavailable or not_confirmed.");
      } else {
        availability = rawAvailability as Availability;
      }
    }

    const imageUrl = readCell(row, "imageurl", "image");
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      errors.push("Variant image URL must start with http(s).");
    }
    if (imageUrl && !args.uploadImages) {
      warnings.push("Variant image URL will be ignored. Re-run with --upload-images to upload it.");
    }

    return {
      row: rowNumber,
      productSku,
      variant: {
        label,
        sku: variantSku || null,
        attributes,
        price,
        priceStatus,
        unit: unit || null,
        availability,
        imageUrl: imageUrl || null,
      },
      errors,
      warnings,
    };
  });

  const variantSkuOwners = new Map<string, string>();
  for (const plan of variantPlans) {
    const variantSku = plan.variant.sku?.toLowerCase();
    if (!variantSku) continue;
    const owner = variantSkuOwners.get(variantSku);
    if (owner && owner !== plan.productSku.toLowerCase()) {
      plan.warnings.push(
        `Variant SKU "${plan.variant.sku}" is also used by product ${owner}. Confirm this is intentional.`,
      );
    } else {
      variantSkuOwners.set(variantSku, plan.productSku.toLowerCase());
    }
  }

  mergeVariantsIntoPlans(plans, variantPlans);

  const invalidVariants = variantPlans.filter((plan) => plan.errors.length > 0);
  const counts = {
    rows: plans.length,
    valid: plans.filter((plan) => plan.action !== "invalid").length,
    invalid: plans.filter((plan) => plan.action === "invalid").length,
    create: plans.filter((plan) => plan.action === "create").length,
    update: plans.filter((plan) => plan.action === "update").length,
    skipped: plans.filter((plan) => plan.action === "skip-exists" || plan.action === "skip-missing")
      .length,
    variantRows: variantPlans.length,
    invalidVariantRows: invalidVariants.length,
  };

  console.log("");
  console.log(`Make My Home import — ${args.commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`  Products file: ${args.file}`);
  console.log(`  Variants file: ${variantsPath ?? "(none)"}`);
  console.log(`  Dataset: ${projectId}/${dataset}`);
  console.log("");
  console.log(
    `  ${counts.rows} product row(s): ${counts.create} to create, ${counts.update} to update, ` +
      `${counts.skipped} skipped, ${counts.invalid} invalid.`,
  );
  if (counts.variantRows > 0) {
    console.log(
      `  ${counts.variantRows} variant row(s): ${counts.invalidVariantRows} invalid.`,
    );
  }
  console.log("");

  for (const plan of plans) {
    const marker =
      plan.action === "invalid"
        ? "✗"
        : plan.action === "create"
          ? "+"
          : plan.action === "update"
            ? "~"
            : "·";
    console.log(`${marker} row ${plan.row} · ${plan.sku || "(no SKU)"} · ${plan.action}`);
    for (const warning of plan.warnings) console.log(`    warning: ${warning}`);
    for (const error of plan.errors) console.log(`    error: ${error}`);
  }

  if (invalidVariants.length > 0) {
    console.log("");
    for (const plan of invalidVariants) {
      console.log(`✗ variant row ${plan.row} · ${plan.productSku || "(no product SKU)"}`);
      for (const warning of plan.warnings) console.log(`    warning: ${warning}`);
      for (const error of plan.errors) console.log(`    error: ${error}`);
    }
  }

  const reportRows: ReportRow[] = plans.map((plan) => ({
    row: plan.row,
    sku: plan.sku,
    name: plan.name,
    action: plan.action,
    result: plan.action === "invalid" ? "failed" : "pending",
    errors: plan.errors,
    warnings: plan.warnings,
  }));

  if (args.commit) {
    console.log("");
    console.log("Writing to Sanity…");

    for (const plan of plans) {
      const report = reportRows.find((entry) => entry.row === plan.row);
      if (!report) continue;

      if (plan.action === "invalid") {
        report.result = "failed";
        continue;
      }
      if (plan.action === "skip-exists" || plan.action === "skip-missing") {
        report.result = "skipped";
        continue;
      }
      if (!plan.fields) {
        report.result = "failed";
        plan.errors.push("No fields were prepared for this row.");
        continue;
      }

      try {
        if (args.uploadImages && plan.imagesToUpload.length > 0) {
          const images: Array<Record<string, unknown>> = [];
          for (const [index, url] of plan.imagesToUpload.entries()) {
            const alt = plan.name;
            const image = await uploadImage(client, url, alt);
            image._key = `image-${index + 1}`;
            images.push(image);
          }
          plan.fields.images = images;
        }

        if (args.uploadImages && plan.variantImageSlots.length > 0) {
          const variants = plan.fields.variants;
          if (Array.isArray(variants)) {
            for (const slot of plan.variantImageSlots) {
              const image = await uploadImage(
                client,
                slot.url,
                `${plan.name} variant image`,
              );
              const target = variants[slot.index] as Record<string, unknown> | undefined;
              if (target) target.image = image;
            }
          }
        }

        const fields = { ...plan.fields };
        delete fields._type;

        if (plan.action === "create") {
          await client.create({ ...plan.fields, _type: "product" });
        } else if (plan.existingId) {
          await client.patch(plan.existingId).set(fields).commit();
        }

        report.result = "written";
        console.log(`✓ row ${plan.row} · ${plan.sku} · ${plan.action} complete`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        plan.errors.push(message);
        report.errors = plan.errors;
        report.result = "failed";
        console.error(`✗ row ${plan.row} · ${plan.sku} · failed: ${message}`);
      }
    }
  }

  const written = reportRows.filter((row) => row.result === "written").length;
  const failed = reportRows.filter((row) => row.result === "failed").length;
  const skipped = reportRows.filter((row) => row.result === "skipped").length;

  const report = {
    generatedAt: new Date().toISOString(),
    mode: args.commit ? "commit" : "dry-run",
    dataset: `${projectId}/${dataset}`,
    files: { products: args.file, variants: variantsPath },
    options: {
      createMissing: args.createMissing,
      updateExisting: args.updateExisting,
      uploadImages: args.uploadImages,
    },
    summary: {
      ...counts,
      written,
      failed,
      skipped,
    },
    rows: reportRows,
    invalidVariantRows: invalidVariants,
  };

  await writeFile(path.resolve(args.report), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("");
  console.log(
    args.commit
      ? `Done. ${written} written, ${failed} failed, ${skipped} skipped. Report: ${args.report}`
      : `Dry run complete. Nothing was written. Report: ${args.report}`,
  );
  if (!args.commit) {
    console.log(
      "Re-run with --commit --create-missing and/or --update-existing when the report looks right.",
    );
  }

  if (failed > 0 || counts.invalid > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
