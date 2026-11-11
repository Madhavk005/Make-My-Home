import "server-only";

import { revalidateTag } from "next/cache";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";
import {
  categoryDeleteBlockers,
  validateCategoryDraft,
  type CategoryFieldErrors,
} from "@/lib/category-validation";
import { pool } from "@/lib/db";
import { sanityClient } from "@/lib/sanity";
import { getSanityWriteClient, isSanityWriteConfigured } from "@/lib/sanity-write";
import { productCategoryRefsQuery } from "@/lib/queries";
import type { Category, CategoryLevel, CategoryNode } from "@/lib/types";

const adminCategoryProjection = `{
  _id,
  name,
  "slug": slug.current,
  description,
  "image": image{..., alt},
  "parentId": parent._ref,
  level,
  isActive,
  order,
  seoTitle,
  seoDescription,
  stage,
  specificationTemplate,
  "createdAt": _createdAt,
  "updatedAt": _updatedAt
}`;

export type CategoryAdminInput = {
  name: string;
  slug: string;
  level: CategoryLevel;
  parentId?: string | null;
  isActive?: boolean;
  order?: number;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type CategoryMutationFailure = {
  ok: false;
  status: number;
  errors: string[];
  fieldErrors?: CategoryFieldErrors;
};

export type CategoryMutationSuccess = {
  ok: true;
  id: string;
  category?: Category;
};

export type CategoryMutationResult = CategoryMutationFailure | CategoryMutationSuccess;

function text(value: string | null | undefined, max: number): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function normalizeId(id: string): string {
  return id.replace(/^drafts\./, "");
}

function slugField(slug: string) {
  return { _type: "slug" as const, current: slug };
}

export async function listAdminCategories(): Promise<Category[]> {
  const client = isSanityWriteConfigured ? getSanityWriteClient() : sanityClient;
  if (!client) return [];
  const categories = await client.fetch<Category[]>(
    `*[_type == "category" && defined(slug.current)] | order(order asc, name asc) ${adminCategoryProjection}`,
  );
  return categories ?? [];
}

export async function getAdminCategoryTree(): Promise<{
  categories: Category[];
  tree: CategoryNode[];
}> {
  const categories = await listAdminCategories();
  return { categories, tree: buildCategoryTree(categories, { includeInactive: true }) };
}

async function listProductRefs(): Promise<Array<{ _id?: string; categoryId?: string | null }>> {
  const client = isSanityWriteConfigured ? getSanityWriteClient() : sanityClient;
  if (!client) return [];
  return (
    (await client.fetch<Array<{ _id?: string; categoryId?: string | null }>>(
      productCategoryRefsQuery,
    )) ?? []
  );
}

function categoryFields(input: CategoryAdminInput, level: CategoryLevel) {
  return {
    name: input.name.trim(),
    slug: slugField(input.slug),
    level,
    parent: input.parentId
      ? { _type: "reference" as const, _ref: normalizeId(input.parentId) }
      : undefined,
    isActive: input.isActive ?? true,
    order: input.order ?? 100,
    description: text(input.description, 400),
    seoTitle: text(input.seoTitle, 60),
    seoDescription: text(input.seoDescription, 160),
  };
}

async function writeAudit(
  actorEmail: string | null | undefined,
  action: string,
  entityId: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorEmail ?? null, action, "category", entityId, JSON.stringify(details)],
    );
  } catch (error) {
    // The catalogue write has already succeeded. Never hide it from the editor
    // because the analytics database is unavailable, but leave a server trace.
    console.error("Category audit log failed:", error);
  }
}

function revalidateCatalogue(): void {
  revalidateTag("categories", "max");
  revalidateTag("products", "max");
}

export async function createCategory(
  input: CategoryAdminInput,
  actorEmail: string | null | undefined,
): Promise<CategoryMutationResult> {
  if (!isSanityWriteConfigured) {
    return {
      ok: false,
      status: 503,
      errors: ["Catalogue writes are not configured on this environment."],
    };
  }

  const existing = await listAdminCategories();
  const validation = validateCategoryDraft(input, existing);
  if (!validation.ok) {
    return { ok: false, status: 422, errors: validation.errors, fieldErrors: validation.fieldErrors };
  }

  const value = validation.value;
  const client = getSanityWriteClient();
  const _id = `category-${crypto.randomUUID()}`;
  const document = {
    _id,
    _type: "category" as const,
    ...categoryFields({ ...input, ...value }, value.level),
  };

  const created = await client.create(document);

  await writeAudit(actorEmail, "create_category", _id, {
    name: value.name,
    slug: value.slug,
    level: value.level,
    parentId: value.parentId,
  });
  revalidateCatalogue();

  return { ok: true, id: created._id };
}

export async function updateCategory(
  id: string,
  input: CategoryAdminInput,
  actorEmail: string | null | undefined,
): Promise<CategoryMutationResult> {
  if (!isSanityWriteConfigured) {
    return {
      ok: false,
      status: 503,
      errors: ["Catalogue writes are not configured on this environment."],
    };
  }

  const categoryId = normalizeId(id);
  const [existing, productRefs] = await Promise.all([listAdminCategories(), listProductRefs()]);
  const current = existing.find((category) => category._id === categoryId);
  if (!current) {
    return { ok: false, status: 404, errors: ["That category no longer exists."] };
  }

  const childCount = existing.filter((category) => category.parentId === categoryId).length;
  const productCount = productRefs.filter((ref) => ref.categoryId === categoryId).length;

  const validation = validateCategoryDraft(
    { ...input, id: categoryId, childCount, productCount },
    existing,
  );
  if (!validation.ok) {
    return { ok: false, status: 422, errors: validation.errors, fieldErrors: validation.fieldErrors };
  }

  const value = validation.value;
  const document = categoryFields({ ...input, ...value }, value.level);
  const patch = getSanityWriteClient().patch(categoryId).set(document);

  if (!value.parentId) patch.unset(["parent"]);

  await patch.commit();

  await writeAudit(actorEmail, "update_category", categoryId, {
    name: value.name,
    slug: value.slug,
    level: value.level,
    parentId: value.parentId,
    isActive: value.isActive,
    order: value.order,
  });
  revalidateCatalogue();

  const category: Category = {
    ...current,
    name: value.name,
    slug: value.slug,
    parentId: value.parentId,
    level: value.level,
    isActive: value.isActive,
    order: value.order,
    description: text(input.description, 400),
    seoTitle: text(input.seoTitle, 60),
    seoDescription: text(input.seoDescription, 160),
    updatedAt: new Date().toISOString(),
  };

  return { ok: true, id: categoryId, category };
}

export async function deleteCategory(
  id: string,
  actorEmail: string | null | undefined,
): Promise<CategoryMutationResult> {
  if (!isSanityWriteConfigured) {
    return {
      ok: false,
      status: 503,
      errors: ["Catalogue writes are not configured on this environment."],
    };
  }

  const categoryId = normalizeId(id);
  const [categories, productRefs] = await Promise.all([listAdminCategories(), listProductRefs()]);
  const category = categories.find((item) => item._id === categoryId);
  if (!category) {
    return { ok: false, status: 404, errors: ["That category no longer exists."] };
  }

  const blockers = categoryDeleteBlockers(categoryId, categories, productRefs);
  if (!blockers.canDelete) {
    return {
      ok: false,
      status: 409,
      errors: [blockers.message ?? "This category cannot be deleted."],
    };
  }

  await getSanityWriteClient().delete(categoryId);
  await writeAudit(actorEmail, "delete_category", categoryId, {
    name: category.name,
    slug: category.slug,
  });
  revalidateCatalogue();

  return { ok: true, id: categoryId };
}

export async function setCategoryActive(
  id: string,
  isActive: boolean,
  actorEmail: string | null | undefined,
): Promise<CategoryMutationResult> {
  if (!isSanityWriteConfigured) {
    return {
      ok: false,
      status: 503,
      errors: ["Catalogue writes are not configured on this environment."],
    };
  }

  const categoryId = normalizeId(id);
  const categories = await listAdminCategories();
  const category = categories.find((item) => item._id === categoryId);
  if (!category) {
    return { ok: false, status: 404, errors: ["That category no longer exists."] };
  }

  await getSanityWriteClient().patch(categoryId).set({ isActive }).commit();
  await writeAudit(actorEmail, "toggle_category", categoryId, {
    name: category.name,
    isActive,
  });
  revalidateCatalogue();

  return { ok: true, id: categoryId };
}

export async function reorderCategories(
  parentId: string | null,
  orderedIds: string[],
  actorEmail: string | null | undefined,
): Promise<CategoryMutationResult> {
  if (!isSanityWriteConfigured) {
    return {
      ok: false,
      status: 503,
      errors: ["Catalogue writes are not configured on this environment."],
    };
  }

  const categories = await listAdminCategories();
  const siblings = categories
    .filter((category) => (category.parentId ?? null) === (parentId ? normalizeId(parentId) : null))
    .map((category) => category._id);

  const requested = orderedIds.map(normalizeId);
  if (
    requested.length !== siblings.length ||
    new Set(requested).size !== requested.length ||
    requested.some((id) => !siblings.includes(id))
  ) {
    return {
      ok: false,
      status: 422,
      errors: ["The reorder list must contain every sibling category exactly once."],
    };
  }

  const transaction = getSanityWriteClient().transaction();
  requested.forEach((id, index) => {
    transaction.patch(id, { set: { order: (index + 1) * 10 } });
  });
  await transaction.commit();

  await writeAudit(actorEmail, "reorder_categories", parentId ?? "root", {
    parentId,
    orderedIds: requested,
  });
  revalidateCatalogue();

  return { ok: true, id: parentId ?? "root" };
}

export function adminCategoriesForTree(categories: Category[]): CategoryNode[] {
  return flattenCategoryTree(buildCategoryTree(categories, { includeInactive: true }));
}
