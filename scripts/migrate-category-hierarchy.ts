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
    description: "Cement, steel, bricks, sand and other materials for the structure of a home.",
    children: [
      {
        name: "Cement",
        slug: "cement",
        description: "OPC, PPC, PSC, white and ready-mix cements.",
        children: [
          { name: "OPC Cement", slug: "opc-cement" },
          { name: "PPC Cement", slug: "ppc-cement" },
          { name: "PSC Cement", slug: "psc-cement" },
          { name: "White Cement", slug: "white-cement" },
          { name: "Ready-Mix Concrete", slug: "ready-mix-speciality-cement" },
        ],
      },
      {
        name: "Steel & TMT",
        slug: "steel-reinforcement",
        description: "TMT bars, binding wire and structural steel.",
        children: [
          { name: "TMT Bars", slug: "tmt-bars" },
          { name: "Binding Wire", slug: "binding-wire" },
          { name: "Structural Steel", slug: "ms-sections" },
        ],
      },
      {
        name: "Bricks & Blocks",
        slug: "bricks-blocks",
        description: "Red bricks, fly ash bricks, AAC blocks and concrete blocks.",
        children: [
          { name: "Red Bricks", slug: "red-clay-bricks" },
          { name: "Fly Ash Bricks", slug: "fly-ash-bricks" },
          { name: "AAC Blocks", slug: "aac-blocks" },
          { name: "Concrete Blocks", slug: "concrete-blocks" },
        ],
      },
      {
        name: "Sand & Aggregates",
        slug: "sand-aggregates",
        description: "River sand, M-sand, crushed stone and gravel.",
        children: [
          { name: "River Sand", slug: "river-sand" },
          { name: "M-Sand", slug: "m-sand" },
          { name: "Crushed Stone", slug: "aggregate" },
          { name: "Gravel", slug: "gravel" },
        ],
      },
      {
        name: "Other Construction Materials",
        slug: "other-construction-materials",
        description: "Roofing, waterproofing, adhesives, chemicals and boards.",
        children: [
          { name: "Roofing Materials", slug: "roofing-materials" },
          { name: "Waterproofing Materials", slug: "waterproofing-materials" },
          { name: "Adhesives", slug: "adhesives" },
          { name: "Construction Chemicals", slug: "construction-chemicals" },
          { name: "Plywood & Boards", slug: "plywood-boards" },
        ],
      },
    ],
  },
  {
    name: "Plumbing",
    slug: "plumbing",
    description: "Pipes, fittings, pumps, valves and taps.",
    children: [
      {
        name: "Pipes",
        slug: "pipes",
        description: "PVC, CPVC, UPVC and PPR pipes.",
        children: [
          { name: "PVC Pipes", slug: "pvc-pipes" },
          { name: "CPVC Pipes", slug: "cpvc-pipes" },
          { name: "UPVC Pipes", slug: "upvc-pipes" },
          { name: "PPR Pipes", slug: "ppr-pipes" },
        ],
      },
      {
        name: "Fittings",
        slug: "fittings",
        description: "Elbows, tees, couplers and connectors.",
        children: [
          { name: "Elbows", slug: "elbows" },
          { name: "Tees", slug: "tees" },
          { name: "Couplers", slug: "couplers" },
          { name: "Connectors", slug: "connectors" },
        ],
      },
      {
        name: "Pumps",
        slug: "pumps",
        description: "Water pumps and submersible pumps.",
        children: [
          { name: "Water Pumps", slug: "water-pumps" },
          { name: "Submersible Pumps", slug: "submersible-pumps" },
        ],
      },
      {
        name: "Valves & Taps",
        slug: "valves-taps",
        description: "Ball valves, gate valves and bib taps.",
        children: [
          { name: "Ball Valves", slug: "ball-valves" },
          { name: "Gate Valves", slug: "gate-valves" },
          { name: "Bib Taps", slug: "bib-taps" },
        ],
      },
    ],
  },
  {
    name: "Flooring",
    slug: "flooring",
    description: "Tiles, natural stone, wooden flooring and specialist flooring.",
    children: [
      {
        name: "Tiles",
        slug: "tiles",
        description: "Ceramic, vitrified, porcelain and designer tiles.",
        children: [
          { name: "Ceramic Tiles", slug: "ceramic-tiles" },
          { name: "Vitrified Tiles", slug: "vitrified-tiles" },
          { name: "Porcelain Tiles", slug: "porcelain-tiles" },
          { name: "Designer Tiles", slug: "designer-tiles" },
        ],
      },
      {
        name: "Natural Stone",
        slug: "natural-stone",
        description: "Marble, granite and Kota stone.",
        children: [
          { name: "Marble", slug: "marble" },
          { name: "Granite", slug: "granite" },
          { name: "Kota Stone", slug: "kota-stone" },
        ],
      },
      {
        name: "Wooden Flooring",
        slug: "wooden-flooring",
        description: "Laminate, engineered wood and vinyl flooring.",
        children: [
          { name: "Laminate Flooring", slug: "laminate-flooring" },
          { name: "Engineered Wood", slug: "engineered-wood-flooring" },
          { name: "Vinyl Flooring", slug: "vinyl-flooring" },
        ],
      },
      {
        name: "Other Flooring",
        slug: "other-flooring",
        description: "Epoxy, outdoor flooring and floor accessories.",
        children: [
          { name: "Epoxy Flooring", slug: "epoxy-flooring" },
          { name: "Outdoor Flooring", slug: "outdoor-flooring" },
          { name: "Floor Accessories", slug: "floor-accessories" },
        ],
      },
    ],
  },
  {
    name: "Electrical",
    slug: "electrical",
    description: "Wires, switches, distribution and electrical accessories.",
    children: [
      {
        name: "Wires & Cables",
        slug: "wires-cables",
        description: "Copper wires, aluminium cables and flexible cables.",
        children: [
          { name: "Copper Wires", slug: "copper-wires" },
          { name: "Aluminium Cables", slug: "aluminium-cables" },
          { name: "Flexible Cables", slug: "flexible-cable" },
        ],
      },
      {
        name: "Switches & Sockets",
        slug: "switches-sockets",
        description: "Modular switches, power sockets and smart switches.",
        children: [
          { name: "Modular Switches", slug: "modular-switches" },
          { name: "Power Sockets", slug: "power-sockets" },
          { name: "Smart Switches", slug: "smart-switches" },
        ],
      },
      {
        name: "Distribution",
        slug: "distribution",
        description: "MCB, RCCB and distribution boards.",
        children: [
          { name: "MCB", slug: "mcb" },
          { name: "RCCB", slug: "rccb" },
          { name: "Distribution Boards", slug: "distribution-boards" },
        ],
      },
      {
        name: "Electrical Accessories",
        slug: "electrical-accessories",
        description: "Conduits, junction boxes and electrical tape.",
        children: [
          { name: "Conduits", slug: "conduits" },
          { name: "Junction Boxes", slug: "junction-boxes" },
          { name: "Electrical Tape", slug: "electrical-tape" },
        ],
      },
    ],
  },
  {
    name: "Sanitary",
    slug: "sanitary",
    description: "Toilets, wash basins, bathroom accessories and fittings.",
    children: [
      {
        name: "Toilets",
        slug: "toilets",
        description: "Western, Indian and wall-hung toilets.",
        children: [
          { name: "Western Toilets", slug: "western-toilets" },
          { name: "Indian Toilets", slug: "indian-toilets" },
          { name: "Wall-Hung Toilets", slug: "wall-hung-toilets" },
        ],
      },
      {
        name: "Wash Basins",
        slug: "wash-basins",
        description: "Countertop and wall-mounted basins.",
        children: [
          { name: "Countertop Basins", slug: "countertop-basins" },
          { name: "Wall-Mounted Basins", slug: "wall-mounted-basins" },
        ],
      },
      {
        name: "Bathroom Accessories",
        slug: "bathroom-accessories",
        description: "Soap dispensers, towel rods and mirrors.",
        children: [
          { name: "Soap Dispensers", slug: "soap-dispensers" },
          { name: "Towel Rods", slug: "towel-rails" },
          { name: "Mirrors", slug: "mirrors" },
        ],
      },
      {
        name: "Bathroom Fittings",
        slug: "bathroom-fittings",
        description: "Showers, faucets and flush systems.",
        children: [
          { name: "Showers", slug: "showers" },
          { name: "Faucets", slug: "faucets" },
          { name: "Flush Systems", slug: "flush-systems" },
        ],
      },
    ],
  },
  {
    name: "Paint",
    slug: "paint",
    description: "Interior, exterior, primer, putty and speciality paint.",
    children: [
      {
        name: "Interior Paint",
        slug: "interior-paint",
        description: "Emulsion, distemper and texture paint.",
        children: [
          { name: "Emulsion Paint", slug: "emulsion-paint" },
          { name: "Distemper", slug: "distemper" },
          { name: "Texture Paint", slug: "texture-paint" },
        ],
      },
      {
        name: "Exterior Paint",
        slug: "exterior-paint",
        description: "Weatherproof paint and exterior emulsion.",
        children: [
          { name: "Weatherproof Paint", slug: "weatherproof-paint" },
          { name: "Exterior Emulsion", slug: "exterior-emulsion" },
        ],
      },
      {
        name: "Primers & Putty",
        slug: "primers-putty",
        description: "Wall primer and wall putty.",
        children: [
          { name: "Wall Primer", slug: "wall-primer" },
          { name: "Wall Putty", slug: "wall-putty" },
        ],
      },
      {
        name: "Special Paint",
        slug: "special-paint",
        description: "Wood paint, metal paint and waterproof coatings.",
        children: [
          { name: "Wood Paint", slug: "wood-paint" },
          { name: "Metal Paint", slug: "metal-paint" },
          { name: "Waterproof Coatings", slug: "waterproof-coatings" },
        ],
      },
    ],
  },
  {
    name: "Lighting",
    slug: "lighting",
    description: "Indoor, decorative, outdoor and LED lighting.",
    children: [
      {
        name: "Indoor Lighting",
        slug: "indoor-lighting",
        description: "Ceiling lights, panel lights and downlights.",
        children: [
          { name: "Ceiling Lights", slug: "ceiling-lights" },
          { name: "Panel Lights", slug: "panel-lights" },
          { name: "Downlights", slug: "downlights" },
        ],
      },
      {
        name: "Decorative Lighting",
        slug: "decorative-lighting",
        description: "Chandeliers, pendant lights and wall lights.",
        children: [
          { name: "Chandeliers", slug: "chandeliers" },
          { name: "Pendant Lights", slug: "pendant-lights" },
          { name: "Wall Lights", slug: "wall-lights" },
        ],
      },
      {
        name: "Outdoor Lighting",
        slug: "outdoor-lighting",
        description: "Garden lights, street lights and flood lights.",
        children: [
          { name: "Garden Lights", slug: "garden-lights" },
          { name: "Street Lights", slug: "street-lights" },
          { name: "Flood Lights", slug: "flood-lights" },
        ],
      },
      {
        name: "LED Lighting",
        slug: "led-lighting",
        description: "LED strips, LED bulbs and LED profiles.",
        children: [
          { name: "LED Strips", slug: "led-strips" },
          { name: "LED Bulbs", slug: "led-bulbs" },
          { name: "LED Profiles", slug: "led-profiles" },
        ],
      },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    description: "Living room, bedroom, kitchen and office furniture.",
    children: [
      {
        name: "Living Room",
        slug: "living-room",
        description: "Sofas, coffee tables and TV units.",
        children: [
          { name: "Sofas", slug: "sofas" },
          { name: "Coffee Tables", slug: "coffee-tables" },
          { name: "TV Units", slug: "tv-units" },
        ],
      },
      {
        name: "Bedroom",
        slug: "bedroom",
        description: "Beds, wardrobes and bedside tables.",
        children: [
          { name: "Beds", slug: "beds" },
          { name: "Wardrobes", slug: "wardrobes" },
          { name: "Bedside Tables", slug: "bedside-tables" },
        ],
      },
      {
        name: "Kitchen",
        slug: "kitchen",
        description: "Modular kitchens, kitchen cabinets and storage units.",
        children: [
          { name: "Modular Kitchens", slug: "modular-kitchens" },
          { name: "Kitchen Cabinets", slug: "kitchen-cabinets" },
          { name: "Storage Units", slug: "storage-units" },
        ],
      },
      {
        name: "Office",
        slug: "office",
        description: "Office chairs, desks and storage cabinets.",
        children: [
          { name: "Office Chairs", slug: "office-chairs" },
          { name: "Office Desks", slug: "office-desks" },
          { name: "Storage Cabinets", slug: "storage-cabinets" },
        ],
      },
    ],
  },
  {
    name: "Hiring / Equipment Rental",
    slug: "hiring-equipment-rental",
    description: "Construction machinery, tools, scaffolding and transport on hire.",
    children: [
      {
        name: "Construction Machinery",
        slug: "construction-machinery",
        description: "JCB, excavators and concrete mixers.",
        children: [
          { name: "JCB", slug: "jcb" },
          { name: "Excavators", slug: "excavators" },
          { name: "Concrete Mixers", slug: "concrete-mixers" },
        ],
      },
      {
        name: "Tools & Equipment",
        slug: "tools-equipment",
        description: "Drilling, cutting and welding machines.",
        children: [
          { name: "Drilling Machines", slug: "drilling-machines" },
          { name: "Cutting Machines", slug: "cutting-machines" },
          { name: "Welding Machines", slug: "welding-machines" },
        ],
      },
      {
        name: "Scaffolding & Support",
        slug: "scaffolding-support",
        description: "Scaffolding, ladders and shuttering plates.",
        children: [
          { name: "Scaffolding", slug: "scaffolding" },
          { name: "Ladders", slug: "ladders" },
          { name: "Shuttering Plates", slug: "shuttering-plates" },
        ],
      },
      {
        name: "Transportation",
        slug: "transportation",
        description: "Tractor, dumper and crane on hire.",
        children: [
          { name: "Tractor", slug: "tractor" },
          { name: "Dumper", slug: "dumper" },
          { name: "Crane", slug: "crane" },
        ],
      },
    ],
  },
];

const LEGACY_SLUG = "construction-legacy";
const LEGACY_NEW_SLUG = "construction-legacy";
const LEGACY_NAME = "Construction (Legacy)";

/**
 * Branches that are no longer part of the requested taxonomy. They are kept in
 * the dataset (and restored by rollback) but hidden from the public site.
 */
const RETIRED_SLUGS = new Set([
  "rapid-hardening-cement",
  "sulphate-resistant-cement",
  "low-heat-cement",
  "masonry-cement",
  "construction-legacy",
  "stone-dust",
  "stone-marble",
  "pipes-fittings",
  "gi-pipes",
  "pipe-fittings",
  "taps-faucets",
  "basin-taps",
  "kitchen-taps",
  "water-tanks",
  "overhead-tanks",
  "underground-tanks",
  "floor-tiles",
  "wall-tiles",
  "marble-granite",
  "marble-flooring",
  "granite-flooring",
  "house-wire",
  "switches",
  "sockets",
  "circuit-protection",
  "kitchen-sinks",
  "stainless-steel-sinks",
  "quartz-sinks",
  "bathroom-showers",
  "enamel-paint",
  "spotlights",
  "fans-ventilation",
  "ceiling-fans",
  "exhaust-fans",
  "dining",
  "dining-tables",
  "dining-chairs",
  "construction-equipment",
  "vibrators",
  "power-tools",
  "drills",
  "cutters",
  "labour-services",
  "mason-services",
  "electrician-services",
  "plumber-services",
]);

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

  // Orders are derived from the requested taxonomy so each sibling group is
  // laid out exactly as specified, regardless of its previous order values.
  const siblingOrder = new Map<string, number>();
  const siblingCounts = new Map<string | null, number>();
  for (const { node, parentSlug } of flat) {
    const next = (siblingCounts.get(parentSlug) ?? 0) + 1;
    siblingCounts.set(parentSlug, next);
    siblingOrder.set(slugKey(node.slug), next * 10);
  }

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
    const expectedOrder = siblingOrder.get(slug) ?? 100;

    if (existing) {
      const row = planned.get(existing._id);
      if (!row) continue;

      // The taxonomy deliberately reuses existing nodes and may rename,
      // reparent or promote them (for example Toilets becomes a secondary).
      if (row.name !== node.name) {
        applyChange(row, `name ${row.name} → ${node.name}`, () => {
          row.name = node.name;
        });
      }
      if (existing.parentId !== parentId) {
        applyChange(row, `parent ${existing.parentId ?? "root"} → ${parentId ?? "root"}`, () => {
          row.parentId = parentId;
        });
      }
      if (row.level !== level) {
        applyChange(row, `level ${row.level ?? "unset"} → ${level}`, () => {
          row.level = level;
        });
      }
      if (row.order !== expectedOrder) {
        applyChange(row, `order ${row.order} → ${expectedOrder}`, () => {
          row.order = expectedOrder;
        });
      }
      if (!row.isActive) {
        applyChange(row, "reactivate (belongs to requested taxonomy)", () => {
          row.isActive = true;
        });
      }
      if (row.slug !== node.slug) {
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
        order: expectedOrder,
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

  // The legacy Construction node stays a tertiary under Cement because the
  // Taataa product still points at it. It is retired (inactive) by default
  // because it is not part of the requested taxonomy.
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

  // Retire obsolete branches without deleting them. Keeping the documents
  // makes the change reversible and preserves any products or audit history.
  for (const category of categories) {
    if (!RETIRED_SLUGS.has(slugKey(category.slug))) continue;
    const row = planned.get(category._id);
    if (!row) continue;

    if (row.isActive) {
      applyChange(row, "retire (set inactive)", () => {
        row.isActive = false;
      });
    }

    const affectedProducts = products.filter((product) => product.categoryId === category._id);
    if (affectedProducts.length > 0) {
      warnings.push(
        `Retired category "${category.name}" still has ${affectedProducts.length} product(s): ${affectedProducts
          .map((product) => product.name)
          .join(", ")}. Products were not moved.`,
      );
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

  // An active child under a retired parent would silently disappear from the
  // public site because inactive branches are pruned. Surface that instead.
  for (const row of rows) {
    if (!row.isActive) continue;
    const seen = new Set<string>([row._id]);
    let parent = row.parentId ? rowById.get(row.parentId) : undefined;
    while (parent) {
      if (seen.has(parent._id)) break;
      seen.add(parent._id);
      if (!parent.isActive) {
        warnings.push(
          `Active category "${row.name}" sits under retired parent "${parent.name}" and will be hidden publicly.`,
        );
        break;
      }
      parent = parent.parentId ? rowById.get(parent.parentId) : undefined;
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
    retiredCategories: categories
      .filter((category) => RETIRED_SLUGS.has(slugKey(category.slug)))
      .map((category) => ({
        id: category._id,
        name: category.name,
        slug: category.slug,
        productCount: products.filter((product) => product.categoryId === category._id).length,
        note: "Retained in Sanity but inactive; not part of the requested taxonomy.",
      })),
    preservedCategories: categories
      .filter((category) => {
        const slug = slugKey(category.slug);
        if (RETIRED_SLUGS.has(slug)) return false;
        if (flattenTaxonomy(TAXONOMY).some((entry) => slugKey(entry.node.slug) === slug)) {
          return false;
        }
        return !plan.rows.some((row) => row._id === category._id && row.managed);
      })
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
          note: "Retained as an inactive tertiary category. The product on it was not moved.",
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
  console.log(
    `Requested taxonomy: ${flattenTaxonomy(TAXONOMY).length} nodes; retired branches: ${summary.retiredCategories.length}.`,
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
