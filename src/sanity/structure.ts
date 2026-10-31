import type { StructureResolver } from "sanity/structure";

type CategoryRow = {
  _id: string;
  name: string;
  parentId?: string | null;
  stage?: string | null;
};

type BrandRow = {
  _id: string;
  name: string;
};

const STAGES = [
  { value: "structure", title: "Foundation & structure" },
  { value: "finishing", title: "Finishing" },
  { value: "services", title: "Electrical & plumbing" },
  { value: "other", title: "Other / unassigned" },
] as const;

const productHealth = (S: Parameters<StructureResolver>[0], title: string, filter: string) =>
  S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType("product")
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

export const structure: StructureResolver = async (S, context) => {
  let categories: CategoryRow[] = [];
  let brands: BrandRow[] = [];

  try {
    const client = context.getClient({ apiVersion: "2025-01-01" });
    [categories, brands] = await Promise.all([
      client.fetch<CategoryRow[]>(
        `*[_type == "category" && defined(slug.current)] | order(order asc, name asc){
          _id,
          name,
          "parentId": parent._ref,
          stage
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
                        .filter('_type == "product" && !defined(brand)')
                        .defaultOrdering([{ field: "name", direction: "asc" }]),
                    ),
                ]),
            ),
        ]
      : [];

  const categoriesByStage = S.listItem()
    .title("Categories by build stage")
    .id("categories-by-stage")
    .child(
      S.list()
        .title("Categories by build stage")
        .items(
          STAGES.map((stage) =>
            S.listItem()
              .title(stage.title)
              .id(`categories-stage-${stage.value}`)
              .child(
                S.documentList()
                  .title(stage.title)
                  .schemaType("category")
                  .filter(
                    '_type == "category" && !defined(parent) && (stage == $stage || (!defined(stage) && $stage == "other"))',
                  )
                  .params({ stage: stage.value })
                  .defaultOrdering([
                    { field: "order", direction: "asc" },
                    { field: "name", direction: "asc" },
                  ]),
              ),
          ),
        ),
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
      categoriesByStage,
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
