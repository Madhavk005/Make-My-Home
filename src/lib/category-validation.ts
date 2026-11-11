import type { CategoryLevel } from "./types";

/**
 * Pure category validation helpers shared by the admin dashboard, API routes,
 * Sanity Studio validation and the migration/import scripts.
 *
 * The parent chain is the source of truth. A stored `level` is a denormalised
 * convenience field and is checked against the actual depth of the parent
 * chain, so stale or hand-edited levels cannot create invalid nesting.
 */

export const CATEGORY_LEVELS: CategoryLevel[] = ["primary", "secondary", "tertiary"];

export const CATEGORY_LEVEL_LABELS: Record<CategoryLevel, string> = {
  primary: "Primary category",
  secondary: "Secondary category",
  tertiary: "Tertiary category",
};

export const CATEGORY_LEVEL_DEPTH: Record<CategoryLevel, number> = {
  primary: 0,
  secondary: 1,
  tertiary: 2,
};

export type CategoryRecordLike = {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  level?: CategoryLevel | null;
  isActive?: boolean | null;
  order?: number | null;
  description?: string | null;
};

export type CategoryDraftInput = {
  id?: string | null;
  name: string;
  slug: string;
  level: CategoryLevel;
  parentId?: string | null;
  isActive?: boolean;
  order?: number;
  childCount?: number;
  productCount?: number;
};

export type CategoryFieldErrors = Partial<
  Record<"name" | "slug" | "level" | "parentId" | "order" | "form", string>
>;

export type CategoryValidationResult =
  | {
      ok: true;
      value: {
        name: string;
        slug: string;
        level: CategoryLevel;
        parentId: string | null;
        isActive: boolean;
        order: number;
      };
    }
  | { ok: false; errors: string[]; fieldErrors: CategoryFieldErrors };

export function isCategoryLevel(value: unknown): value is CategoryLevel {
  return value === "primary" || value === "secondary" || value === "tertiary";
}

export function categoryLevelFromDepth(depth: number): CategoryLevel | null {
  if (depth === 0) return "primary";
  if (depth === 1) return "secondary";
  if (depth === 2) return "tertiary";
  return null;
}

/** Lower-case, URL-safe slug. Also used when the editor leaves a slug blank. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Walks a category's parent chain. Returns root → category, or null when the
 * category is missing or the chain is circular/broken.
 */
export function resolveCategoryChain<T extends CategoryRecordLike>(
  categories: T[],
  categoryId: string,
): T[] | null {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const chain: T[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);

  while (current) {
    if (seen.has(current._id)) return null;
    seen.add(current._id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return chain;
}

/** Actual depth of a category, or null when the parent chain is broken. */
export function categoryDepth(
  categories: CategoryRecordLike[],
  categoryId: string,
): number | null {
  const chain = resolveCategoryChain(categories, categoryId);
  return chain ? chain.length - 1 : null;
}

export function categoryLevel(
  categories: CategoryRecordLike[],
  categoryId: string,
): CategoryLevel | null {
  const depth = categoryDepth(categories, categoryId);
  return depth === null ? null : categoryLevelFromDepth(depth);
}

export function childCategories<T extends CategoryRecordLike>(
  categories: T[],
  parentId: string | null,
): T[] {
  return categories
    .filter((category) => (category.parentId ?? null) === parentId)
    .sort(compareCategoryRecords);
}

export function compareCategoryRecords(
  a: CategoryRecordLike,
  b: CategoryRecordLike,
): number {
  const orderA = typeof a.order === "number" ? a.order : 100;
  const orderB = typeof b.order === "number" ? b.order : 100;
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name);
}

export function descendantCategoryIds<T extends CategoryRecordLike>(
  categories: T[],
  categoryId: string,
): string[] {
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = children.get(category.parentId) ?? [];
    list.push(category._id);
    children.set(category.parentId, list);
  }

  const result: string[] = [];
  const seen = new Set<string>();
  const queue = [categoryId];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    queue.push(...(children.get(id) ?? []));
  }

  return result;
}

export function validateCategoryDraft(
  input: CategoryDraftInput,
  categories: CategoryRecordLike[],
): CategoryValidationResult {
  const errors: string[] = [];
  const fieldErrors: CategoryFieldErrors = {};

  const name = input.name.trim();
  if (!name) {
    fieldErrors.name = "A category name is required.";
  } else if (name.length < 2 || name.length > 80) {
    fieldErrors.name = "Category names must be between 2 and 80 characters.";
  }

  const slug = slugify(input.slug) || slugify(name);
  if (!slug) {
    fieldErrors.slug = "A URL slug is required.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug = "Use lower-case letters, numbers and hyphens only.";
  }

  if (!isCategoryLevel(input.level)) {
    fieldErrors.level = "Choose primary, secondary or tertiary.";
  }

  const parentId = input.parentId?.trim() || null;
  const selfId = input.id?.replace(/^drafts\./, "") ?? null;
  const byId = new Map(categories.map((category) => [category._id, category]));

  if (input.level === "primary" && parentId) {
    fieldErrors.parentId = "Primary categories cannot have a parent.";
  }

  if (input.level === "secondary" && !parentId) {
    fieldErrors.parentId = "Secondary categories must have a primary parent.";
  }

  if (input.level === "tertiary" && !parentId) {
    fieldErrors.parentId = "Tertiary categories must have a secondary parent.";
  }

  let actualLevel: CategoryLevel | null = null;

  if (parentId) {
    if (selfId && parentId === selfId) {
      fieldErrors.parentId = "A category cannot be its own parent.";
    } else {
      const parent = byId.get(parentId);
      if (!parent) {
        fieldErrors.parentId = "The selected parent category no longer exists.";
      } else {
        const parentChain = resolveCategoryChain(categories, parentId);
        if (!parentChain) {
          fieldErrors.parentId =
            "The selected parent is part of a broken or circular hierarchy.";
        } else if (selfId && parentChain.some((category) => category._id === selfId)) {
          fieldErrors.parentId =
            "That parent would create a circular category hierarchy.";
        } else {
          const parentDepth = parentChain.length - 1;
          const expectedLevel = categoryLevelFromDepth(parentDepth + 1);
          if (!expectedLevel) {
            fieldErrors.parentId =
              "Categories can only have three levels. Move this category under a primary or secondary category.";
          } else if (input.level !== expectedLevel) {
            fieldErrors.parentId = `A ${input.level} category must sit directly under a ${
              input.level === "secondary" ? "primary" : "secondary"
            } category. The selected parent is a ${parentChain[parentChain.length - 1].level ?? "category"}.`;
          }
          actualLevel = expectedLevel;
        }
      }
    }
  } else if (input.level === "primary") {
    actualLevel = "primary";
  }

  if (slug) {
    const conflict = categories.find(
      (category) =>
        normalizeSlug(category.slug) === normalizeSlug(slug) &&
        category._id !== selfId,
    );
    if (conflict) {
      fieldErrors.slug = `The slug "${slug}" is already used by "${conflict.name}". Slugs must be unique.`;
    }
  }

  if (selfId) {
    const current = byId.get(selfId);
    const currentDepth = categoryDepth(categories, selfId);
    const currentLevel =
      currentDepth === null ? current?.level ?? null : categoryLevelFromDepth(currentDepth);

    if (
      (input.childCount ?? 0) > 0 &&
      currentLevel &&
      actualLevel &&
      currentLevel !== actualLevel
    ) {
      fieldErrors.level =
        "Move or remove child categories before changing this category's level.";
    }

    if ((input.productCount ?? 0) > 0 && actualLevel && actualLevel !== "tertiary") {
      fieldErrors.parentId =
        "This category contains products. Move those products to a tertiary category before changing its level.";
    }
  }

  for (const message of Object.values(fieldErrors)) {
    if (message) errors.push(message);
  }

  if (Object.keys(fieldErrors).length > 0 || !actualLevel) {
    return {
      ok: false,
      errors: errors.length > 0 ? Array.from(new Set(errors)) : ["The category is not valid."],
      fieldErrors,
    };
  }

  return {
    ok: true,
    value: {
      name,
      slug,
      level: actualLevel,
      parentId: actualLevel === "primary" ? null : parentId,
      isActive: input.isActive ?? true,
      order:
        typeof input.order === "number" && Number.isFinite(input.order)
          ? Math.max(0, Math.min(9999, Math.trunc(input.order)))
          : 100,
    },
  };
}

export type DeleteBlockers = {
  canDelete: boolean;
  childIds: string[];
  childCategories: CategoryRecordLike[];
  productIds: string[];
  message: string | null;
};

export function categoryDeleteBlockers(
  categoryId: string,
  categories: CategoryRecordLike[],
  productRefs: Array<{ _id?: string; categoryId?: string | null }>,
): DeleteBlockers {
  const children = categories.filter((category) => category.parentId === categoryId);
  const productIds = productRefs
    .filter((product) => product.categoryId === categoryId && product._id)
    .map((product) => product._id as string);

  const reasons: string[] = [];
  if (children.length > 0) {
    reasons.push(
      `${children.length} child ${children.length === 1 ? "category" : "categories"}`,
    );
  }
  if (productIds.length > 0) {
    reasons.push(
      `${productIds.length} ${productIds.length === 1 ? "product" : "products"}`,
    );
  }

  return {
    canDelete: reasons.length === 0,
    childIds: children.map((child) => child._id),
    childCategories: children,
    productIds,
    message:
      reasons.length > 0
        ? `This category cannot be deleted because it contains ${reasons.join(" and ")}. Move them first.`
        : null,
  };
}

export type ProductCategoryValidation = {
  ok: boolean;
  reason?: "missing" | "inactive" | "not-tertiary" | "broken";
  message?: string;
  chain?: CategoryRecordLike[];
  primaryId?: string | null;
  secondaryId?: string | null;
};

export function validateProductCategory(
  categories: CategoryRecordLike[],
  categoryId: string | null | undefined,
  options: { allowInactive?: boolean } = {},
): ProductCategoryValidation {
  if (!categoryId) {
    return { ok: false, reason: "missing", message: "Choose a tertiary category." };
  }

  const chain = resolveCategoryChain(categories, categoryId);
  if (!chain) {
    return {
      ok: false,
      reason: "broken",
      message: "The selected category is missing or part of a broken hierarchy.",
    };
  }

  if (chain.length !== 3) {
    return {
      ok: false,
      reason: "not-tertiary",
      message:
        "Products must be assigned to a tertiary category (primary → secondary → tertiary).",
      chain,
    };
  }

  const selected = chain[chain.length - 1];
  if (selected.isActive === false && !options.allowInactive) {
    return {
      ok: false,
      reason: "inactive",
      message:
        "That category is inactive. Choose an active tertiary category for a new product.",
      chain,
    };
  }

  return {
    ok: true,
    chain,
    primaryId: chain[0]._id,
    secondaryId: chain[1]._id,
  };
}

/** Category search across names, slugs and ancestor names. */
export function searchCategoryRecords<T extends CategoryRecordLike>(
  categories: T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return categories;

  return categories.filter((category) => {
    const chain = resolveCategoryChain(categories, category._id) ?? [category];
    const haystack = chain
      .map((item) => `${item.name} ${item.slug}`)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

/** Stable display order within a sibling set: 10, 20, 30, … */
export function reorderValues(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * 10);
}

export function sortSiblings<T extends CategoryRecordLike>(items: T[]): T[] {
  return [...items].sort(compareCategoryRecords);
}

export function nextOrderValue(existing: CategoryRecordLike[]): number {
  const max = existing.reduce(
    (value, category) => Math.max(value, typeof category.order === "number" ? category.order : 0),
    0,
  );
  return max + 10;
}
