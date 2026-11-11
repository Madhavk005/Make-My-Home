import type { ListItemBuilder, StructureResolver } from "sanity/structure";

type CategoryRow = {
  _id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  level?: string | null;
  isActive?: boolean | null;
};

type BrandRow = {
  _id: string;
  name: string;
};

const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";

const productHealth = (S: Parameters<StructureResolver>[0], title: string, filter: string) =>
  S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType("product")
        .apiVersion(apiVersion)
        .filter(filter)
        .defaultOrdering([{ field: "name", direction: "asc" }]),
    );

function subtreeIds(categories: CategoryRow[], rootId: string): string[] {
  const children = new Map<string, CategoryRow[]>();
  for (const category of categories) {
    const parent = category.parentId;
    if (!parent) continue;
    const list = children.get(parent) ?? [];
    list.push(category);
    children.set(parent, list);
  }

  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || ids.includes(id)) continue;
    ids.push(id);
    for (const child of children.get(id) ?? []) queue.push(child._id);
  }
  return ids;
}

function categoryChildren(categories: CategoryRow[], parentId: string | null): CategoryRow[] {
  return categories
    .filter((category) => (category.parentId ?? null) === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Studio tree for primary → secondary → tertiary categories. Each level opens
 * a list containing the editor for that category, its children, and an "add
 * child" action that prefills the parent reference and level.
 */
function categoryTreeItem(
  S: Parameters<StructureResolver>[0],
  category: CategoryRow,
  categories: CategoryRow[],
  depth: number,
): ListItemBuilder {
  const children = categoryChildren(categories, category._id);
  const title = `${category.isActive === false ? "○ " : ""}${category.name}`;
  const levelLabel =
    depth === 0 ? "primary category" : depth === 1 ? "secondary category" : "tertiary category";

  if (depth >= 2) {
    return S.listItem()
      .title(title)
      .id(`category-node-${category._id}`)
      .child(
        S.document()
          .title(category.name)
          .schemaType("category")
          .documentId(category._id),
      );
  }

  return S.listItem()
    .title(title)
    .id(`category-node-${category._id}`)
    .child(
      S.list()
        .title(`${category.name} · ${levelLabel}`)
        .items([
          S.listItem()
            .title("Edit category")
            .id(`category-edit-${category._id}`)
            .child(S.document().title(category.name).schemaType("category").documentId(category._id)),
          S.divider(),
          ...children.map((child) => categoryTreeItem(S, child, categories, depth + 1)),
          S.listItem()
            .title(depth === 0 ? "Add secondary category" : "Add tertiary category")
            .id(`category-add-${category._id}`)
            .child(
              S.document()
                .title(depth === 0 ? "New secondary category" : "New tertiary category")
                .schemaType("category")
                .initialValueTemplate(
                  depth === 0 ? "category-secondary" : "category-tertiary",
                  { parentId: category._id },
                ),
            ),
        ]),
    );
}

export const structure: StructureResolver = async (S, context) => {
  let categories: CategoryRow[] = [];
  let brands: BrandRow[] = [];

  try {
    const client = context.getClient({ apiVersion });
    [categories, brands] = await Promise.all([
      client.fetch<CategoryRow[]>(
        `*[_type == "category" && defined(slug.current)] | order(order asc, name asc){
          _id,
          name,
          "slug": slug.current,
          "parentId": parent._ref,
          level,
          isActive
        }`,
      ),
      client.fetch<BrandRow[]>(
        `*[_type == "brand" && defined(slug.current)] | order(order asc, name asc){
          _id,
          name
        }`,
      ),
    ]);
  } catch {
    // The Studio still works with the static lists below if the catalogue
    // cannot be fetched (for example while offline).
  }

  const topLevel = categories.filter((category) => !category.parentId);
  const categoryItems = topLevel.map((category) => {
    const categoryIds = subtreeIds(categories, category._id);
    return S.listItem()
      .title(category.name)
      .id(`products-category-${category._id}`)
      .child(
        S.documentList()
          .title(category.name)
          .schemaType("product")
          .apiVersion(apiVersion)
          .filter('_type == "product" && category._ref in $categoryIds')
          .params({ categoryIds })
          .defaultOrdering([{ field: "name", direction: "asc" }]),
      );
  });

  const brandItems = brands.map((brand) =>
    S.listItem()
      .title(brand.name)
      .id(`products-brand-${brand._id}`)
      .child(
        S.documentList()
          .title(brand.name)
          .schemaType("product")
          .apiVersion(apiVersion)
          .filter('_type == "product" && brand._ref == $brandId')
          .params({ brandId: brand._id })
          .defaultOrdering([{ field: "name", direction: "asc" }]),
      ),
  );

  const browseByCategory =
    categoryItems.length > 0
      ? [
          S.listItem()
            .title("Products by category")
            .id("products-by-category")
            .child(
              S.list()
                .title("Products by category")
                .items([
                  ...categoryItems,
                  S.listItem()
                    .title("Uncategorised")
                    .id("products-category-none")
                    .child(
                      S.documentList()
                        .title("Uncategorised products")
                        .schemaType("product")
                        .apiVersion(apiVersion)
                        .filter('_type == "product" && !defined(category)')
                        .defaultOrdering([{ field: "name", direction: "asc" }]),
                    ),
                ]),
            ),
        ]
      : [];

  const browseByBrand =
    brandItems.length > 0
      ? [
          S.listItem()
            .title("Products by brand")
            .id("products-by-brand")
            .child(
              S.list()
                .title("Products by brand")
                .items([
                  ...brandItems,
                  S.listItem()
                    .title("No brand")
                    .id("products-brand-none")
                    .child(
                      S.documentList()
                        .title("Products with no brand")
                        .schemaType("product")
                        .apiVersion(apiVersion)
                        .filter('_type == "product" && !defined(brand)')
                        .defaultOrdering([{ field: "name", direction: "asc" }]),
                    ),
                ]),
            ),
        ]
      : [];

  const categoriesTree = S.listItem()
    .title("Category tree")
    .id("category-tree")
    .child(
      S.list()
        .title("Categories (primary → secondary → tertiary)")
        .items([
          ...categoryChildren(categories, null).map((category) =>
            categoryTreeItem(S, category, categories, 0),
          ),
          S.divider(),
          S.listItem()
            .title("Add primary category")
            .id("category-add-root")
            .child(
              S.document()
                .title("New primary category")
                .schemaType("category")
                .initialValueTemplate("category-primary"),
            ),
        ]),
    );

  return S.list()
    .title("Make My Home")
    .items([
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.divider(),
      S.listItem()
        .title("All products")
        .id("all-products")
        .child(
          S.documentTypeList("product")
            .apiVersion(apiVersion)
            .title("All products")
            .defaultOrdering([{ field: "name", direction: "asc" }]),
        ),
      ...browseByCategory,
      ...browseByBrand,
      S.listItem()
        .title("Recently updated products")
        .id("recent-products")
        .child(
          S.documentList()
            .title("Recently updated products")
            .schemaType("product")
            .apiVersion(apiVersion)
            .filter('_type == "product"')
            .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
        ),
      S.listItem()
        .title("Unpublished drafts")
        .id("draft-products")
        .child(
          S.documentList()
            .title("Unpublished drafts")
            .schemaType("product")
            .apiVersion(apiVersion)
            .filter('_type == "product" && _id in path("drafts.**")')
            .defaultOrdering([{ field: "_updatedAt", direction: "desc" }]),
        ),
      S.listItem()
        .title("Prices & units")
        .id("prices-units")
        .child(
          S.documentList()
            .title("Prices & units")
            .schemaType("product")
            .apiVersion(apiVersion)
            .filter(
              '_type == "product" && (defined(price) || priceStatus != "not_supplied" || defined(variants))',
            )
            .defaultOrdering([{ field: "name", direction: "asc" }]),
        ),
      S.divider(),
      S.listItem()
        .title("All categories")
        .id("all-categories")
        .child(
          S.documentTypeList("category")
            .title("All categories")
            .defaultOrdering([
              { field: "order", direction: "asc" },
              { field: "name", direction: "asc" },
            ]),
        ),
      categoriesTree,
      S.listItem()
        .title("Unlevelled categories")
        .id("unlevelled-categories")
        .child(
          S.documentList()
            .title("Categories missing a level")
            .schemaType("category")
            .apiVersion(apiVersion)
            .filter('_type == "category" && !defined(level)')
            .defaultOrdering([
              { field: "order", direction: "asc" },
              { field: "name", direction: "asc" },
            ]),
        ),
      S.listItem()
        .title("Brands")
        .id("brands")
        .child(
          S.documentTypeList("brand")
            .title("Brands")
            .defaultOrdering([
              { field: "order", direction: "asc" },
              { field: "name", direction: "asc" },
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Catalogue health")
        .child(
          S.list()
            .title("Catalogue health")
            .items([
              productHealth(S, "Missing images", '_type == "product" && !defined(images[0].asset)'),
              productHealth(S, "Price on request", '_type == "product" && priceStatus == "on_request"'),
              productHealth(S, "Price not supplied", '_type == "product" && priceStatus == "not_supplied"'),
              productHealth(
                S,
                "Fixed price missing an amount",
                '_type == "product" && priceStatus == "fixed" && (!defined(price) || price <= 0)',
              ),
              productHealth(S, "Missing unit", '_type == "product" && !defined(unit)'),
              productHealth(S, "Missing category", '_type == "product" && !defined(category)'),
              productHealth(
                S,
                "No specifications",
                '_type == "product" && (!defined(specifications) || count(specifications) == 0)',
              ),
              productHealth(S, "Featured products", '_type == "product" && featured == true'),
              productHealth(S, "Sample / demo content", '_type == "product" && isDemo == true'),
            ]),
        ),
    ]);
};
