/**
 * Fills empty category images with a photograph already in the dataset.
 *
 * Every category without an image borrows the photo of its most presentable
 * product. Primary and secondary categories fall back to a product in one of
 * their descendants, nearest level first. Nothing is uploaded and no new asset
 * is created: the existing product asset is referenced, so the same file backs
 * both the product card and the category card.
 *
 * Categories with no photographed product are left untouched, which keeps the
 * material illustration in place rather than inventing a picture.
 *
 *   npx tsx scripts/assign-category-images.ts            # dry run, prints the plan
 *   npx tsx scripts/assign-category-images.ts --commit   # writes the patches
 *   npx tsx scripts/assign-category-images.ts --commit --overwrite
 *
 * `--overwrite` replaces images that are already set. Without it, categories
 * that already have a photo are reported and skipped.
 */
import { config as loadDotenv } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

// The client takes its project and dataset from sanity.cli.ts, which reads the
// environment, so the files have to be loaded before the client is built.
loadDotenv({ path: [".env.local", ".env"] });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";

/**
 * Writes need an Editor token. Prefer the project's own variable; fall back to
 * the token the Sanity CLI stores on this machine, which is what `sanity exec`
 * would have injected. Nothing is read from disk when the variable is set.
 */
function resolveWriteToken(): string | undefined {
  const fromEnv = process.env.SANITY_API_WRITE_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  try {
    const configPath = path.join(
      process.env.HOME ?? process.env.USERPROFILE ?? "",
      ".config",
      "sanity",
      "config.json",
    );
    const config = JSON.parse(readFileSync(configPath, "utf8")) as { authToken?: string };
    return config.authToken?.trim() || undefined;
  } catch {
    return undefined;
  }
}

const token = resolveWriteToken();

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

const ALREADY_SET_MESSAGE = "already has an image";

type CategoryRow = {
  _id: string;
  name: string;
  slug: string | null;
  level: "primary" | "secondary" | "tertiary";
  parentId: string | null;
  hasImage: boolean;
  hasDraft: boolean;
};

type ProductRow = {
  _id: string;
  name: string;
  categoryId: string;
  assetId: string;
  alt: string | null;
  imageCount: number;
  isDemo: boolean;
  featured: boolean;
  availability: string | null;
};

type Candidate = {
  /** How many levels below the category the product sits at. 0 = its own product. */
  depth: number;
  product: ProductRow;
};

type Plan = {
  category: CategoryRow;
  path: string[];
  candidate: Candidate;
};

function rank(product: ProductRow): number[] {
  return [
    product.isDemo ? 1 : 0,
    product.availability === "available" ? 0 : 1,
    -product.imageCount,
  ];
}

/** Negative when `a` should win. Nearer levels beat better-ranked deeper ones. */
function compareCandidates(a: Candidate, b: Candidate): number {
  if (a.depth !== b.depth) return a.depth - b.depth;
  const ra = rank(a.product);
  const rb = rank(b.product);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] !== rb[i]) return ra[i] - rb[i];
  }
  return a.product.name.localeCompare(b.product.name);
}

function altText(category: CategoryRow, product: ProductRow): string {
  const base = product.alt?.trim() || product.name;
  const sentence = `${base} — photograph representing ${category.name}`;
  return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
}

async function main() {
  const commit = process.argv.includes("--commit");
  const overwrite = process.argv.includes("--overwrite");

  if (commit && !token) {
    console.error(
      "Writing needs an Editor token. Set SANITY_API_WRITE_TOKEN or run `npx sanity login` first.",
    );
    process.exit(1);
  }

  const [categories, products] = await Promise.all([
    client.fetch<CategoryRow[]>(`*[_type == "category"] | order(level asc, name asc){
      _id,
      name,
      "slug": slug.current,
      level,
      "parentId": parent._ref,
      "hasImage": defined(image.asset._ref),
      "hasDraft": count(*[_id == "drafts." + ^._id]) > 0
    }`),
    client.fetch<ProductRow[]>(`*[_type == "product" && defined(category._ref) && defined(images[0].asset._ref)]{
      _id,
      name,
      "categoryId": category._ref,
      "assetId": images[0].asset._ref,
      "alt": images[0].alt,
      "imageCount": count(images),
      "isDemo": coalesce(isDemo, false),
      "featured": coalesce(featured, false),
      "availability": availability
    }`),
  ]);

  const byId = new Map(categories.map((category) => [category._id, category]));
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = children.get(category.parentId) ?? [];
    list.push(category._id);
    children.set(category.parentId, list);
  }

  const ownProducts = new Map<string, ProductRow[]>();
  for (const product of products) {
    const list = ownProducts.get(product.categoryId) ?? [];
    list.push(product);
    ownProducts.set(product.categoryId, list);
  }

  // How many photographed products sit in each branch, so a parent category
  // borrows from the sub-category that actually holds most of its catalogue
  // instead of whichever product happens to rank first across all branches.
  const subtreeSize = new Map<string, number>();
  const countSubtree = (id: string): number => {
    const cached = subtreeSize.get(id);
    if (cached !== undefined) return cached;
    let total = (ownProducts.get(id) ?? []).length;
    for (const childId of children.get(id) ?? []) total += countSubtree(childId);
    subtreeSize.set(id, total);
    return total;
  };

  // Best candidate for a category: its own photographed products, else the best
  // candidate from its largest descendant branch. Memoised because parents
  // reuse children.
  const best = new Map<string, Candidate | null>();
  const resolve = (id: string): Candidate | null => {
    if (best.has(id)) return best.get(id) ?? null;

    const direct = (ownProducts.get(id) ?? []).map((product) => ({ depth: 0, product }));
    let winner = direct.sort(compareCandidates)[0] ?? null;

    if (!winner) {
      const branches = [...(children.get(id) ?? [])].sort(
        (a, b) => countSubtree(b) - countSubtree(a) || a.localeCompare(b),
      );
      for (const childId of branches) {
        const child = resolve(childId);
        if (!child) continue;
        winner = { depth: child.depth + 1, product: child.product };
        break;
      }
    }

    best.set(id, winner);
    return winner;
  };

  const plans: Plan[] = [];
  const skippedExisting: CategoryRow[] = [];
  const skippedNoPhoto: CategoryRow[] = [];

  const pathOf = (id: string): string[] => {
    const names: string[] = [];
    let current = byId.get(id);
    const seen = new Set<string>();
    while (current && !seen.has(current._id)) {
      seen.add(current._id);
      names.unshift(current.name);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return names;
  };

  for (const category of categories) {
    if (category.hasImage && !overwrite) {
      skippedExisting.push(category);
      continue;
    }
    const candidate = resolve(category._id);
    if (!candidate) {
      skippedNoPhoto.push(category);
      continue;
    }
    plans.push({ category, path: pathOf(category._id), candidate });
  }

  const byLevel = { primary: 0, secondary: 0, tertiary: 0 };
  for (const plan of plans) byLevel[plan.category.level] += 1;

  console.log(`Categories:   ${categories.length}`);
  console.log(`Products with a photo: ${products.length}`);
  console.log("");
  console.log(`To assign:    ${plans.length} (primary ${byLevel.primary}, secondary ${byLevel.secondary}, tertiary ${byLevel.tertiary})`);
  console.log(`Skipped, ${ALREADY_SET_MESSAGE}: ${skippedExisting.length}`);
  console.log(`Skipped, no photographed product: ${skippedNoPhoto.length}`);
  console.log("");

  for (const plan of plans) {
    const { category, path, candidate } = plan;
    const via = candidate.depth === 0 ? "own product" : `${candidate.depth} level${candidate.depth === 1 ? "" : "s"} below`;
    console.log(`${path.join(" › ")}  ←  ${candidate.product.name} (${via})`);
    if (category.hasDraft) {
      console.log("    ! an unpublished draft of this category also exists; check it in Studio");
    }
  }

  if (skippedNoPhoto.length > 0) {
    console.log("");
    console.log("No photo available (material illustration stays):");
    for (const category of skippedNoPhoto) {
      console.log(`  ${[...pathOf(category._id)].join(" › ")}`);
    }
  }

  if (!commit) {
    console.log("");
    console.log("Dry run. Re-run with --commit to write these patches.");
    return;
  }

  const chunkSize = 50;
  for (let i = 0; i < plans.length; i += chunkSize) {
    const chunk = plans.slice(i, i + chunkSize);
    const transaction = client.transaction();
    for (const { category, candidate } of chunk) {
      transaction.patch(category._id, (patch) =>
        patch.set({
          image: {
            _type: "image",
            asset: { _type: "reference", _ref: candidate.product.assetId },
            alt: altText(category, candidate.product),
          },
        }),
      );
    }
    await transaction.commit();
    console.log(`Committed ${Math.min(i + chunkSize, plans.length)}/${plans.length}`);
  }

  console.log("");
  console.log("Done. Published category documents now reference existing product photos.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
