import type { Category, CategoryNode } from "./types";
import { fuzzyIncludes } from "./search";

function compareCategories(a: Category, b: Category): number {
  const orderA = typeof a.order === "number" ? a.order : 100;
  const orderB = typeof b.order === "number" ? b.order : 100;
  if (orderA !== orderB) return orderA - orderB;
  return a.name.localeCompare(b.name);
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();

  for (const category of categories) {
    nodes.set(category._id, {
      ...category,
      children: [],
      path: [],
      depth: 0,
      productCount: 0,
    });
  }

  const roots: CategoryNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent._id !== node._id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const visited = new Set<string>();

  const walk = (node: CategoryNode, parentPath: string[], depth: number) => {
    if (visited.has(node._id)) return;
    visited.add(node._id);

    node.path = [...parentPath, node.slug];
    node.depth = depth;
    node.children.sort(compareCategories);

    for (const child of node.children) {
      walk(child, node.path, depth + 1);
    }
  };

  roots.sort(compareCategories);
  for (const root of roots) walk(root, [], 0);

  // A malformed hierarchy (for example, an orphaned cycle) must not make the
  // catalogue disappear. Promote any unvisited category to a root.
  for (const node of nodes.values()) {
    if (!visited.has(node._id)) {
      roots.push(node);
      walk(node, [], 0);
    }
  }

  roots.sort(compareCategories);
  return roots;
}

export function flattenCategoryTree(tree: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const seen = new Set<string>();

  const walk = (node: CategoryNode) => {
    if (seen.has(node._id)) return;
    seen.add(node._id);
    result.push(node);
    for (const child of node.children) walk(child);
  };

  for (const root of tree) walk(root);
  return result;
}

export function categoryHref(path: string[] | string): string {
  const segments = Array.isArray(path) ? path : path.split("/").filter(Boolean);
  return `/category/${segments.map(encodeURIComponent).join("/")}`;
}

export function findCategoryByPath(
  tree: CategoryNode[],
  slugPath: string[],
): CategoryNode | null {
  const joined = slugPath.filter(Boolean).join("/");
  if (!joined) return null;

  return (
    flattenCategoryTree(tree).find((category) => category.path.join("/") === joined) ?? null
  );
}

export function categoryBreadcrumb(
  categories: Category[],
  categoryId: string,
): CategoryNode[] {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const chain: Category[] = [];
  const seen = new Set<string>();
  let current = byId.get(categoryId);

  while (current && !seen.has(current._id)) {
    seen.add(current._id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  const tree = buildCategoryTree(categories);
  const nodes = new Map(flattenCategoryTree(tree).map((node) => [node._id, node]));

  return chain
    .map((category) => nodes.get(category._id))
    .filter((node): node is CategoryNode => Boolean(node));
}

export function directChildren(categories: Category[], parentId: string | null): Category[] {
  return categories
    .filter((category) => (category.parentId ?? null) === parentId)
    .sort(compareCategories);
}

/**
 * Categories whose own name or slug contains the search text, plus all of their
 * descendants. GROQ cannot walk arbitrary parent chains, so the catalogue tree
 * is resolved here and the matching ids are passed into the product query.
 */
export function categoryIdsMatchingQuery(categories: Category[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const matches = categories.filter(
    (category) =>
      fuzzyIncludes(category.name, needle) ||
      fuzzyIncludes(category.slug, needle),
  );
  if (matches.length === 0) return [];

  const result = new Set<string>();
  for (const category of matches) {
    for (const id of descendantIds(categories, category._id)) result.add(id);
  }
  return Array.from(result);
}

export function descendantIds(categories: Category[], categoryId: string): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = childrenByParent.get(category.parentId) ?? [];
    list.push(category._id);
    childrenByParent.set(category.parentId, list);
  }

  const result: string[] = [];
  const seen = new Set<string>();
  const queue = [categoryId];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    queue.push(...(childrenByParent.get(id) ?? []));
  }

  return result;
}

export function countProductsByCategory(
  categories: Category[],
  productCategoryRefs: Array<{ categoryId?: string | null }>,
): Map<string, number> {
  const direct = new Map<string, number>();
  for (const ref of productCategoryRefs) {
    if (!ref.categoryId) continue;
    direct.set(ref.categoryId, (direct.get(ref.categoryId) ?? 0) + 1);
  }

  const childrenByParent = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const list = childrenByParent.get(category.parentId) ?? [];
    list.push(category._id);
    childrenByParent.set(category.parentId, list);
  }

  const totals = new Map<string, number>();
  const visiting = new Set<string>();

  const totalFor = (id: string): number => {
    if (totals.has(id)) return totals.get(id) as number;
    if (visiting.has(id)) return 0;
    visiting.add(id);

    let total = direct.get(id) ?? 0;
    for (const childId of childrenByParent.get(id) ?? []) {
      total += totalFor(childId);
    }

    visiting.delete(id);
    totals.set(id, total);
    return total;
  };

  for (const category of categories) totalFor(category._id);
  return totals;
}

export function attachProductCounts(
  tree: CategoryNode[],
  counts: Map<string, number>,
): CategoryNode[] {
  for (const node of flattenCategoryTree(tree)) {
    node.productCount = counts.get(node._id) ?? 0;
  }
  return tree;
}
