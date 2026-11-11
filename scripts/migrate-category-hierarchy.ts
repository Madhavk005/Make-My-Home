/**
 * Idempotent three-level category migration.
 *
 *   npx tsx scripts/migrate-category-hierarchy.ts            # dry run, writes report
 *   npx tsx scripts/migrate-category-hierarchy.ts --apply    # backup + apply
 *
 * The script is additive: existing categories are preserved. It creates the
 * requested primary taxonomy, reuses `Cement` as a secondary under
 * `Construction`, and promotes its existing children to tertiary categories.
 */
import { config as loadDotenv } from "dotenv";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";

loadDotenv({ path: [".env.local", ".env"] });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";
const apply = process.argv.includes("--apply");

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set.");
  process.exit(1);
}
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is required for the migration.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
  token,
});

type CategoryRow = {
  _id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  level: string | null;
  isActive: boolean | null;
  order: number | null;
  childCount?: number;
};

type ProductRefRow = {
  _id: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
};

type CategoryLevel = "primary" | "secondary" | "tertiary";

type PlannedCategory = {
  _id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: CategoryLevel | null;
  order: number;
  isActive: boolean;
  action: "create" | "update" | "unchanged";
  changes: string[];
  managed: boolean;
};

type TaxonomyNode = {
  name: string;
  slug: string;
  description?: string;
  children?: TaxonomyNode[];
};

const TAXONOMY: TaxonomyNode[] = [
  {
    name: "Construction",
    slug: "construction",
    description: "Cement, bricks, sand, steel and stone for the structure of a home.",
    children: [
      {
        name: "Cement",
        slug: "cement",
        description: "OPC, PPC, white, rapid-hardening and speciality cements.",
      },
      {
        name: "Bricks & Blocks",
        slug: "bricks-blocks",
        children: [
          { name: "Red Clay Bricks", slug: "red-clay-bricks" },
          { name: "AAC Blocks", slug: "aac-blocks" },
          { name: "Concrete Blocks", slug: "concrete-blocks" },
        ],
      },
      {
        name: "Sand & Aggregates",
        slug: "sand-aggregates",
        children: [
          { name: "River Sand", slug: "river-sand" },
          { name: "M-Sand", slug: "m-sand" },
          { name: "Aggregate", slug: "aggregate" },
          { name: "Stone Dust", slug: "stone-dust" },
        ],
      },
      {
        name: "Steel & Reinforcement",
        slug: "steel-reinforcement",
        children: [
          { name: "TMT Bars", slug: "tmt-bars" },
          { name: "Binding Wire", slug: "binding-wire" },
          { name: "MS Angles & Channels", slug: "ms-sections" },
        ],
      },
      {
        name: "Stone & Marble",
        slug: "stone-marble",
        children: [
          { name: "Kota Stone", slug: "kota-stone" },
          { name: "Marble", slug: "marble" },
          { name: "Granite", slug: "granite" },
        ],
      },
    ],
  },
  {
    name: "Plumbing",
    slug: "plumbing",
    description: "Pipes, fittings, taps and water storage.",
    children: [
      {
        name: "Pipes & Fittings",
        slug: "pipes-fittings",
        children: [
          { name: "CPVC Pipes", slug: "cpvc-pipes" },
          { name: "PVC Pipes", slug: "pvc-pipes" },
          { name: "GI Pipes", slug: "gi-pipes" },
          { name: "Pipe Fittings", slug: "pipe-fittings" },
        ],
      },
      {
        name: "Taps & Faucets",
        slug: "taps-faucets",
        children: [
          { name: "Basin Taps", slug: "basin-taps" },
          { name: "Kitchen Taps", slug: "kitchen-taps" },
          { name: "Showers", slug: "showers" },
        ],
      },
      {
        name: "Water Tanks",
        slug: "water-tanks",
        children: [
          { name: "Overhead Tanks", slug: "overhead-tanks" },
          { name: "Underground Tanks", slug: "underground-tanks" },
        ],
      },
    ],
  },
  {
    name: "Flooring",
    slug: "flooring",
    description: "Tiles, stone, marble and wooden flooring.",
    children: [
      {
        name: "Tiles",
        slug: "tiles",
        children: [
          { name: "Floor Tiles", slug: "floor-tiles" },
          { name: "Wall Tiles", slug: "wall-tiles" },
          { name: "Vitrified Tiles", slug: "vitrified-tiles" },
        ],
      },
      {
        name: "Marble & Granite",
        slug: "marble-granite",
        children: [
          { name: "Marble Flooring", slug: "marble-flooring" },
          { name: "Granite Flooring", slug: "granite-flooring" },
        ],
      },
      {
        name: "Wooden Flooring",
        slug: "wooden-flooring",
        children: [
          { name: "Laminate Flooring", slug: "laminate-flooring" },
          { name: "Engineered Wood Flooring", slug: "engineered-wood-flooring" },
        ],
      },
    ],
  },
  {
    name: "Electrical",
    slug: "electrical",
    description: "Wires, switches, sockets and circuit protection.",
    children: [
      {
        name: "Wires & Cables",
        slug: "wires-cables",
        children: [
          { name: "House Wire", slug: "house-wire" },
          { name: "Flexible Cable", slug: "flexible-cable" },
        ],
      },
      {
        name: "Switches & Sockets",
        slug: "switches-sockets",
        children: [
          { name: "Switches", slug: "switches" },
          { name: "Sockets", slug: "sockets" },
        ],
      },
      {
        name: "Circuit Protection",
        slug: "circuit-protection",
        children: [
          { name: "MCB", slug: "mcb" },
          { name: "Distribution Boards", slug: "distribution-boards" },
        ],
      },
    ],
  },
  {
    name: "Sanitary",
    slug: "sanitary",
    description: "Bathroom fittings, kitchen sinks and bathroom accessories.",
    children: [
      {
        name: "Bathroom Fittings",
        slug: "bathroom-fittings",
        children: [
          { name: "Wash Basins", slug: "wash-basins" },
          { name: "Toilets", slug: "toilets" },
          { name: "Bathroom Showers", slug: "bathroom-showers" },
        ],
      },
      {
        name: "Kitchen Sinks",
        slug: "kitchen-sinks",
        children: [
          { name: "Stainless Steel Sinks", slug: "stainless-steel-sinks" },
          { name: "Quartz Sinks", slug: "quartz-sinks" },
        ],
      },
      {
        name: "Bathroom Accessories",
        slug: "bathroom-accessories",
        children: [
          { name: "Towel Rails", slug: "towel-rails" },
          { name: "Mirrors", slug: "mirrors" },
        ],
      },
    ],
  },
  {
    name: "Paint",
    slug: "paint",
    description: "Interior and exterior paint, primers and putty.",
    children: [
      {
        name: "Interior Paint",
        slug: "interior-paint",
        children: [
          { name: "Emulsion Paint", slug: "emulsion-paint" },
          { name: "Enamel Paint", slug: "enamel-paint" },
        ],
      },
      {
        name: "Exterior Paint",
        slug: "exterior-paint",
        children: [{ name: "Weatherproof Paint", slug: "weatherproof-paint" }],
      },
      {
        name: "Primers & Putty",
        slug: "primers-putty",
        children: [
          { name: "Wall Primer", slug: "wall-primer" },
          { name: "Wall Putty", slug: "wall-putty" },
        ],
      },
    ],
  },
  {
    name: "Lighting",
    slug: "lighting",
    description: "Indoor and outdoor lighting, fans and ventilation.",
    children: [
      {
        name: "Indoor Lighting",
        slug: "indoor-lighting",
        children: [
          { name: "LED Bulbs", slug: "led-bulbs" },
          { name: "Ceiling Lights", slug: "ceiling-lights" },
          { name: "Spotlights", slug: "spotlights" },
        ],
      },
      {
        name: "Outdoor Lighting",
        slug: "outdoor-lighting",
        children: [
          { name: "Street Lights", slug: "street-lights" },
          { name: "Garden Lights", slug: "garden-lights" },
        ],
      },
      {
        name: "Fans & Ventilation",
        slug: "fans-ventilation",
        children: [
          { name: "Ceiling Fans", slug: "ceiling-fans" },
          { name: "Exhaust Fans", slug: "exhaust-fans" },
        ],
      },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    description: "Living room, bedroom and dining furniture.",
    children: [
      {
        name: "Living Room",
        slug: "living-room",
        children: [
          { name: "Sofas", slug: "sofas" },
          { name: "Coffee Tables", slug: "coffee-tables" },
        ],
      },
      {
        name: "Bedroom",
        slug: "bedroom",
        children: [
          { name: "Beds", slug: "beds" },
          { name: "Wardrobes", slug: "wardrobes" },
        ],
      },
      {
        name: "Dining",
        slug: "dining",
        children: [
          { name: "Dining Tables", slug: "dining-tables" },
          { name: "Dining Chairs", slug: "dining-chairs" },
        ],
      },
    ],
  },
  {
    name: "Hiring / Equipment Rental",
    slug: "hiring-equipment-rental",
    description: "Construction equipment, power tools and skilled labour.",
    children: [
      {
        name: "Construction Equipment",
        slug: "construction-equipment",
        children: [
          { name: "Scaffolding", slug: "scaffolding" },
          { name: "Concrete Mixers", slug: "concrete-mixers" },
          { name: "Vibrators", slug: "vibrators" },
        ],
      },
      {
        name: "Power Tools",
        slug: "power-tools",
        children: [
          { name: "Drills", slug: "drills" },
          { name: "Cutters", slug: "cutters" },
        ],
      },
      {
        name: "Labour & Services",
        slug: "labour-services",
        children: [
          { name: "Mason Services", slug: "mason-services" },
          { name: "Electrician Services", slug: "electrician-services" },
          { name: "Plumber Services", slug: "plumber-services" },
        ],
      },
    ],
  },
];

const LEGACY_SLUG = "construction-legacy";
const LEGACY_NEW_SLUG = "construction-legacy";
const LEGACY_NAME = "Construction (Legacy)";

function slugKey(slug: string | null | undefined): string {
  return (slug ?? "").trim().toLowerCase();
}

function normalizeLevel(level: string | null | undefined): CategoryLevel | null {
  return level === "primary" || level === "secondary" || level === "tertiary"
    ? level
    : null;
}

function makeId(seed: string): string {
  return `category-${createHash("sha1").update(seed).digest("hex").slice(0, 24)}`;
}

function flattenTaxonomy(
  nodes: TaxonomyNode[],
  parentSlug: string | null = null,
  depth = 0,
): Array<{ node: TaxonomyNode; parentSlug: string | null; depth: number }> {
  const result: Array<{ node: TaxonomyNode; parentSlug: string | null; depth: number }> = [];
  for (const node of nodes) {
    result.push({ node, parentSlug, depth });
    if (node.children) result.push(...flattenTaxonomy(node.children, node.slug, depth + 1));
  }
  return result;
}

async function fetchState() {
  const [categories, products, rawCategories] = await Promise.all([
    client.fetch<CategoryRow[]>(
      `*[_type == "category" && !(_id in path("drafts.**"))] | order(order asc, name asc){
        _id, name, "slug": slug.current, "parentId": parent._ref, level, isActive, order
      }`,
    ),
    client.fetch<ProductRefRow[]>(
      `*[_type == "product" && !(_id in path("drafts.**"))] | order(name asc){
        _id, name, sku, "categoryId": category._ref
      }`,
    ),
    client.fetch<unknown[]>(
      `*[_type == "category"] | order(_id asc){
        ...,
        "parentRef": parent._ref
      }`,
    ),
  ]);

  return { categories, products, rawCategories };
}

function planMigration(categories: CategoryRow[], products: ProductRefRow[]) {
  const bySlug = new Map<string, CategoryRow>();
  for (const category of categories) {
    if (category.slug) bySlug.set(slugKey(category.slug), category);
  }

  const planned = new Map<string, PlannedCategory>();
  const conflicts: string[] = [];
  const warnings: string[] = [];

  for (const category of categories) {
    planned.set(category._id, {
      _id: category._id,
      name: category.name,
      slug: category.slug ?? "",
      parentId: category.parentId,
      level: normalizeLevel(category.level),
      order: category.order ?? 100,
      isActive: category.isActive !== false,
      action: "unchanged",
      changes: [],
      managed: false,
    });
  }

  const applyChange = (
    row: PlannedCategory,
    change: string,
    mutate: () => void,
  ) => {
    mutate();
    row.action = row.action === "create" ? "create" : "update";
    row.changes.push(change);
  };

  const legacy =
    bySlug.get(LEGACY_SLUG) ??
    categories.find(
      (category) =>
        slugKey(category.slug) === "construction" && Boolean(category.parentId),
    );
  const legacyParentId = legacy?.parentId ?? null;
  const legacyRow = legacy ? planned.get(legacy._id) : undefined;

  if (legacyRow && legacyRow.name !== LEGACY_NAME) {
    applyChange(legacyRow, `name ${legacyRow.name} → ${LEGACY_NAME}`, () => {
      legacyRow.name = LEGACY_NAME;
    });
  }

  if (legacyRow && legacyRow.slug !== LEGACY_NEW_SLUG) {
    const existingLegacy = bySlug.get(LEGACY_SLUG);
    if (existingLegacy && existingLegacy._id !== legacyRow._id) {
      conflicts.push(
        `Cannot rename "${legacyRow.name}" to ${LEGACY_NEW_SLUG}: the slug is already used by "${existingLegacy.name}".`,
      );
    } else {
      applyChange(legacyRow, `slug ${legacyRow.slug} → ${LEGACY_NEW_SLUG}`, () => {
        legacyRow.slug = LEGACY_NEW_SLUG;
      });
      bySlug.delete("construction");
      bySlug.set(LEGACY_SLUG, legacy as CategoryRow);
    }
  }

  const flat = flattenTaxonomy(TAXONOMY);

  for (const { node, parentSlug, depth } of flat) {
    const slug = slugKey(node.slug);
    const existing = bySlug.get(slug);
    const plannedParent = parentSlug ? bySlug.get(slugKey(parentSlug)) : undefined;

    if (parentSlug && !plannedParent) {
      conflicts.push(`Cannot place "${node.name}" because parent slug "${parentSlug}" is missing.`);
      continue;
    }

    const parentId = plannedParent?._id ?? null;
    const level = (depth === 0 ? "primary" : depth === 1 ? "secondary" : "tertiary") as CategoryLevel;

    if (existing) {
      const row = planned.get(existing._id);
      if (!row) continue;

      // Reuse existing taxonomy nodes, including Cement. Moving Cement and the
      // legacy Construction node is part of the agreed migration; other
      // mismatched parents are reported rather than silently reorganised.
      const shouldMove = node.slug === "cement" || existing.slug === LEGACY_SLUG || row.managed;
      if (existing.parentId !== parentId) {
        if (shouldMove) {
          applyChange(row, `parent ${existing.parentId ?? "root"} → ${parentId ?? "root"}`, () => {
            row.parentId = parentId;
          });
        } else {
          conflicts.push(
            `"${existing.name}" already uses slug ${node.slug} but sits under a different parent. Left unchanged.`,
          );
        }
      }
      if (row.level !== level) {
        applyChange(row, `level ${row.level ?? "unset"} → ${level}`, () => {
          row.level = level;
        });
      }
      if (row.slug !== node.slug) {
        // Only legacy/slug renames above are allowed; managed nodes keep their slug.
        warnings.push(`"${row.name}" has slug ${row.slug}, expected ${node.slug}. Left unchanged.`);
      }
      row.managed = true;
    } else {
      const id = makeId(node.slug);
      const row: PlannedCategory = {
        _id: id,
        name: node.name,
        slug: node.slug,
        parentId,
        level,
        order: (flat.filter((entry) => entry.parentSlug === parentSlug).findIndex((entry) => entry.node.slug === node.slug) + 1) * 10,
        isActive: true,
        action: "create",
        changes: ["create"],
        managed: true,
      };
      planned.set(id, row);
      bySlug.set(slug, {
        _id: id,
        name: node.name,
        slug: node.slug,
        parentId,
        level,
        isActive: true,
        order: row.order,
      });
    }
  }

  // The legacy Construction node must stay a tertiary category because the
  // Taataa product still points at it. Move it from Masonry Cement to Cement.
  if (legacyRow) {
    const cement = bySlug.get("cement");
    if (!cement) {
      conflicts.push("Cement category is missing, so the legacy Construction node cannot be reparented.");
    } else if (legacyRow.parentId === legacyParentId && legacyRow.parentId !== cement._id) {
      applyChange(legacyRow, `parent ${legacyRow.parentId ?? "root"} → ${cement._id} (Cement)`, () => {
        legacyRow.parentId = cement._id;
      });
    }
    if (legacyRow.level !== "tertiary") {
      applyChange(legacyRow, `level ${legacyRow.level} → tertiary`, () => {
        legacyRow.level = "tertiary";
      });
    }
  }

  // Recompute levels for every planned row from the parent chain.
  const rows = Array.from(planned.values());
  const rowById = new Map(rows.map((row) => [row._id, row]));

  const depthOf = (row: PlannedCategory): number | null => {
    let depth = 0;
    let current: PlannedCategory | undefined = row;
    const seen = new Set<string>();

    while (current) {
      if (seen.has(current._id)) return null;
      seen.add(current._id);
      if (!current.parentId) return depth;
      current = rowById.get(current.parentId);
      if (!current) return null;
      depth += 1;
      if (depth > 10) return null;
    }
    return depth;
  };

  for (const row of rows) {
    const depth = depthOf(row);
    if (depth === null) {
      conflicts.push(`Cycle or broken parent chain detected at "${row.name}".`);
      continue;
    }
    const level = (depth === 0 ? "primary" : depth === 1 ? "secondary" : depth === 2 ? "tertiary" : null) as
      | "primary"
      | "secondary"
      | "tertiary"
      | null;
    if (!level) {
      conflicts.push(
        `"${row.name}" would be ${depth + 1} levels deep. The migration only allows three levels.`,
      );
      continue;
    }
    if (row.level !== level) {
      applyChange(row, `recomputed level ${row.level ?? "unset"} → ${level}`, () => {
        row.level = level;
      });
    }
  }

  const slugCounts = new Map<string, number>();
  for (const row of rows) {
    const key = slugKey(row.slug);
    if (!key) {
      conflicts.push(`Category ${row._id} has no slug.`);
      continue;
    }
    slugCounts.set(key, (slugCounts.get(key) ?? 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) conflicts.push(`Slug "${slug}" is used by ${count} categories.`);
  }

  const productIssues: string[] = [];
  for (const product of products) {
    if (!product.categoryId) {
      productIssues.push(`Product "${product.name}" (${product.sku ?? "no SKU"}) has no category.`);
      continue;
    }
    const row = rowById.get(product.categoryId);
    if (!row) {
      productIssues.push(`Product "${product.name}" points at a missing category ${product.categoryId}.`);
      continue;
    }
    const depth = depthOf(row);
    if (depth !== 2) {
      productIssues.push(
        `Product "${product.name}" is filed under "${row.name}" (${depth === null ? "broken" : `depth ${depth}`}); products must be on a tertiary category.`,
      );
    }
  }

  return {
    rows,
    conflicts,
    warnings,
    productIssues,
    legacy,
  };
}

async function backup(categories: unknown[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const directory = "backups";
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `category-migration-${timestamp}.json`);
  await writeFile(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        projectId,
        dataset,
        categories,
      },
      null,
      2,
    ),
  );
  return file;
}

async function main() {
  const { categories, products, rawCategories } = await fetchState();
  const plan = planMigration(categories, products);

  const summary = {
    generatedAt: new Date().toISOString(),
    projectId,
    dataset,
    mode: apply ? "apply" : "dry-run",
    existingCategories: categories.length,
    plannedCategories: plan.rows.length,
    create: plan.rows.filter((row) => row.action === "create").length,
    update: plan.rows.filter((row) => row.action === "update").length,
    unchanged: plan.rows.filter((row) => row.action === "unchanged").length,
    conflicts: plan.conflicts,
    warnings: plan.warnings,
    productIssues: plan.productIssues,
    actions: plan.rows
      .filter((row) => row.action !== "unchanged")
      .map((row) => ({
        id: row._id,
        name: row.name,
        slug: row.slug,
        action: row.action,
        changes: row.changes,
      })),
    preservedCategories: categories
      .filter(
        (category) =>
          !TAXONOMY.some((node) => slugKey(node.slug) === slugKey(category.slug)) &&
          !plan.rows.some((row) => row._id === category._id && row.managed),
      )
      .map((category) => ({
        id: category._id,
        name: category.name,
        slug: category.slug,
        note: "Not part of the requested taxonomy; preserved.",
      })),
    legacy: plan.legacy
      ? {
          id: plan.legacy._id,
          name: plan.legacy.name,
          oldSlug: "construction",
          newSlug: LEGACY_NEW_SLUG,
          productCount: products.filter((product) => product.categoryId === plan.legacy?._id).length,
          note: "Preserved as a tertiary category. Products on it were not moved.",
        }
      : null,
  };

  const reportDirectory = "backups";
  await mkdir(reportDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportFile = path.join(reportDirectory, `category-migration-report-${timestamp}.json`);
  await writeFile(reportFile, JSON.stringify(summary, null, 2));

  console.log(`Mode: ${summary.mode}`);
  console.log(
    `Categories: ${summary.existingCategories} existing → ${summary.plannedCategories} planned (${summary.create} create, ${summary.update} update, ${summary.unchanged} unchanged)`,
  );
  console.log(`Report: ${reportFile}`);

  if (plan.conflicts.length > 0) {
    console.error("\nConflicts:");
    for (const conflict of plan.conflicts) console.error(`- ${conflict}`);
  }
  if (plan.productIssues.length > 0) {
    console.warn("\nProduct issues (not modified by this migration):");
    for (const issue of plan.productIssues) console.warn(`- ${issue}`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply after reviewing the report.");
    return;
  }

  if (plan.conflicts.length > 0) {
    console.error("\nAborting: resolve the conflicts above before applying.");
    process.exit(1);
  }

  const backupFile = await backup(rawCategories);
  console.log(`Backup: ${backupFile}`);

  let created = 0;
  let updated = 0;

  // Sanity validates references against the dataset, not against documents
  // created earlier in the same request. Create parents first in separate
  // writes, then reparent existing categories once every new node exists.
  const levelRank = { primary: 0, secondary: 1, tertiary: 2 } as const;
  const createRows = plan.rows
    .filter((row) => row.action === "create")
    .sort((a, b) => levelRank[a.level ?? "tertiary"] - levelRank[b.level ?? "tertiary"]);
  const updateRows = plan.rows.filter((row) => row.action === "update");

  for (const row of createRows) {
    if (!row.level) throw new Error(`New category "${row.name}" has no level.`);
    await client.create({
      _id: row._id,
      _type: "category",
      name: row.name,
      slug: { _type: "slug", current: row.slug },
      parent: row.parentId
        ? { _type: "reference", _ref: row.parentId }
        : undefined,
      level: row.level,
      isActive: row.isActive,
      order: row.order,
    });
    created += 1;
  }

  for (const row of updateRows) {
    if (!row.level) throw new Error(`Existing category "${row.name}" has no level.`);
    const patch = client.patch(row._id).set({
      name: row.name,
      slug: { _type: "slug", current: row.slug },
      level: row.level,
      isActive: row.isActive,
      order: row.order,
    });

    if (row.parentId) {
      patch.set({ parent: { _type: "reference", _ref: row.parentId } });
    } else {
      patch.unset(["parent"]);
    }

    await patch.commit();
    updated += 1;
  }

  console.log(`Applied: ${created} created, ${updated} updated.`);
  console.log(`Backup kept at ${backupFile}. Rollback: npx tsx scripts/rollback-category-migration.ts ${backupFile} --apply`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
