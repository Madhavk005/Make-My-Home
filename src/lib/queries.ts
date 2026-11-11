import type {
  Availability,
  FacetOption,
  Facets,
  ProductCardData,
  SortKey,
} from "./types";

const productCardProjection = `{
  _id,
  name,
  "slug": slug.current,
  sku,
  "brand": brand->{name, "slug": slug.current, logo},
  "category": category->{_id, name, "slug": slug.current},
  "image": images[0]{..., alt},
  price,
  priceStatus,
  unit,
  availability,
  shortDescription,
  featured,
  isDemo,
  "variantCount": count(variants),
  "fromPrice": coalesce(price, math::min(variants[priceStatus == "fixed"].price)),
  "specSummary": specifications[0...3]{name, value}
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  businessName,
  tagline,
  taglineEn,
  "logo": logo{..., alt},
  whatsappNumber,
  phone,
  email,
  address,
  addressEn,
  serviceArea,
  serviceAreaEn,
  openingHours,
  openingHoursEn,
  announcement,
  announcementEn,
  priceNote,
  priceNoteEn,
  footerNote,
  footerNoteEn,
  instagram,
  facebook
}`;

export const categoriesQuery = `*[_type == "category" && defined(slug.current)] | order(order asc, name asc){
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

export const brandsQuery = `*[_type == "brand" && defined(slug.current)] | order(order asc, name asc){
  _id,
  name,
  "slug": slug.current,
  description,
  "logo": logo{..., alt},
  website,
  order
}`;

export const productCategoryRefsQuery = `*[_type == "product" && defined(category)]{
  _id,
  "categoryId": category._ref
}`;

export const featuredProductsQuery = `*[_type == "product" && defined(slug.current) && featured == true] | order(name asc) [0...8] ${productCardProjection}`;

export const brandsWithCountsQuery = `*[_type == "brand" && defined(slug.current)] | order(order asc, name asc){
  _id,
  name,
  "slug": slug.current,
  description,
  "logo": logo{..., alt},
  website,
  order,
  "count": count(*[_type == "product" && brand._ref == ^._id && defined(slug.current)])
}`;

export const homeBrandsQuery = `*[
  _type == "brand" &&
  defined(slug.current) &&
  count(*[_type == "product" && brand._ref == ^._id]) > 0
] | order(order asc, name asc) [0...12]{
  _id,
  name,
  "slug": slug.current,
  "logo": logo{..., alt},
  "count": count(*[_type == "product" && brand._ref == ^._id])
}`;

export const productBySlugQuery = `*[_type == "product" && defined(slug.current) && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  "brand": brand->{name, "slug": slug.current, logo},
  "category": category->{_id, name, "slug": slug.current},
  "images": images[]{..., alt},
  "variants": variants[]{
    label,
    sku,
    "attributes": attributes[]{name, value},
    price,
    priceStatus,
    unit,
    availability,
    "image": image{..., alt}
  },
  "specifications": specifications[]{name, value, group},
  keywords,
  "fromPrice": coalesce(price, math::min(variants[priceStatus == "fixed"].price))
}`;

export const brandBySlugQuery = `*[_type == "brand" && defined(slug.current) && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  description,
  "logo": logo{..., alt},
  website,
  order
}`;

export const relatedProductsQuery = `*[
  _type == "product" &&
  defined(slug.current) &&
  category._ref in $categoryIds &&
  slug.current != $slug
] | order(select(category._ref == $categoryId => 0, 1), featured desc, name asc) [0...4] ${productCardProjection}`;

export type CatalogQueryInput = {
  categoryIds?: string[] | null;
  /**
   * Categories (and their descendants) whose name matches the search text.
   * Lets a search for "Cement" find products filed under "Cement > OPC"
   * even though GROQ cannot walk the parent chain.
   */
  searchCategoryIds?: string[] | null;
  q?: string | null;
  brandSlugs?: string[];
  availability?: Availability[];
  minPrice?: number | null;
  maxPrice?: number | null;
  specs?: Array<{ name: string; value: string }>;
  sort: SortKey;
  page: number;
  pageSize: number;
};

type BuiltQuery = {
  conditions: string[];
  params: Record<string, unknown>;
};

function searchTerm(query: string): string {
  return `*${query.trim().replace(/\s+/g, " ")}*`;
}

function buildConditions(
  input: CatalogQueryInput,
  options: {
    includeCategory?: boolean;
    includeBrand?: boolean;
    includeAvailability?: boolean;
    includeSpecs?: boolean;
  } = {},
): BuiltQuery {
  const {
    includeCategory = true,
    includeBrand = true,
    includeAvailability = true,
    includeSpecs = true,
  } = options;

  const conditions: string[] = ['_type == "product"', "defined(slug.current)"];
  const params: Record<string, unknown> = {};

  if (includeCategory && input.categoryIds) {
    conditions.push("category._ref in $categoryIds");
    params.categoryIds = input.categoryIds;
  }

  const q = input.q?.trim();
  if (q) {
    const searchParts = [
      "name match $q",
      "sku match $q",
      "brand->name match $q",
      "category->name match $q",
      "count(keywords[@ match $q]) > 0",
      "count((specifications + variants[].attributes)[name match $q || value match $q]) > 0",
    ];

    if (input.searchCategoryIds?.length) {
      searchParts.push("category._ref in $searchCategoryIds");
      params.searchCategoryIds = input.searchCategoryIds;
    }

    conditions.push(`(${searchParts.join(" || ")})`);
    params.q = searchTerm(q);
  }

  if (includeBrand && input.brandSlugs?.length) {
    conditions.push("brand->slug.current in $brandSlugs");
    params.brandSlugs = input.brandSlugs;
  }

  if (includeAvailability && input.availability?.length) {
    conditions.push("availability in $availability");
    params.availability = input.availability;
  }

  if (typeof input.minPrice === "number" && Number.isFinite(input.minPrice)) {
    conditions.push(
      "coalesce(price, math::min(variants[priceStatus == \"fixed\"].price)) >= $minPrice",
    );
    params.minPrice = input.minPrice;
  }

  if (typeof input.maxPrice === "number" && Number.isFinite(input.maxPrice)) {
    conditions.push(
      "coalesce(price, math::min(variants[priceStatus == \"fixed\"].price)) <= $maxPrice",
    );
    params.maxPrice = input.maxPrice;
  }

  if (includeSpecs && input.specs?.length) {
    const groups = new Map<string, Set<string>>();
    for (const spec of input.specs) {
      if (!spec.name || !spec.value) continue;
      const values = groups.get(spec.name) ?? new Set<string>();
      values.add(spec.value);
      groups.set(spec.name, values);
    }

    let index = 0;
    for (const [name, values] of groups) {
      conditions.push(
        `count((specifications + variants[].attributes)[name == $specName${index} && value in $specValues${index}]) > 0`,
      );
      params[`specName${index}`] = name;
      params[`specValues${index}`] = Array.from(values);
      index += 1;
    }
  }

  return { conditions, params };
}

function sortClause(sort: SortKey): string {
  switch (sort) {
    case "name-desc":
      return "name desc";
    case "price-asc":
      return "coalesce(price, math::min(variants[priceStatus == \"fixed\"].price), 999999999) asc, name asc";
    case "price-desc":
      return "coalesce(price, math::min(variants[priceStatus == \"fixed\"].price), -1) desc, name asc";
    case "name-asc":
      return "name asc";
    case "recommended":
    default:
      return "featured desc, name asc";
  }
}

export function buildProductsQuery(input: CatalogQueryInput): {
  query: string;
  params: Record<string, unknown>;
} {
  const { conditions, params } = buildConditions(input);
  const start = (input.page - 1) * input.pageSize;
  const end = start + input.pageSize;
  const condition = conditions.join(" && ");

  return {
    query: `{
      "items": *[${condition}] | order(${sortClause(input.sort)}) [$start...$end] ${productCardProjection},
      "total": count(*[${condition}])
    }`,
    params: { ...params, start, end },
  };
}

export function buildBrandFacetQuery(input: CatalogQueryInput): {
  query: string;
  params: Record<string, unknown>;
} {
  const { conditions, params } = buildConditions(input, { includeBrand: false });
  const condition = conditions.join(" && ");

  return {
    query: `*[
      _type == "brand" &&
      defined(slug.current) &&
      count(*[${condition} && brand._ref == ^._id]) > 0
    ] | order(name asc){
      name,
      "slug": slug.current,
      "count": count(*[${condition} && brand._ref == ^._id])
    }`,
    params,
  };
}

export function buildAvailabilityFacetQuery(input: CatalogQueryInput): {
  query: string;
  params: Record<string, unknown>;
} {
  const { conditions, params } = buildConditions(input, { includeAvailability: false });
  const condition = conditions.join(" && ");

  return {
    query: `{
      "available": count(*[${condition} && availability == "available"]),
      "on_request": count(*[${condition} && availability == "on_request"]),
      "unavailable": count(*[${condition} && availability == "unavailable"]),
      "not_confirmed": count(*[${condition} && availability == "not_confirmed"])
    }`,
    params,
  };
}

export function buildSpecFacetQuery(input: CatalogQueryInput): {
  query: string;
  params: Record<string, unknown>;
} {
  const { conditions, params } = buildConditions(input, { includeSpecs: false });
  const condition = conditions.join(" && ");

  return {
    query: `*[${condition}]{
      "pairs": (specifications + variants[].attributes)[]{name, value}
    }`,
    params,
  };
}

export type FacetProductRow = {
  brand?: { name?: string; slug?: string } | null;
  availability?: Availability | null;
  pairs?: Array<{ name?: string; value?: string }> | null;
};

export function assembleFacets(
  brandRows: Array<{ name?: string; slug?: string; count?: number }> | null,
  availabilityCounts: Partial<Record<Availability, number>> | null,
  specRows: FacetProductRow[] | null,
): Facets {
  const brands: FacetOption[] = (brandRows ?? [])
    .filter((row): row is { name: string; slug: string; count: number } =>
      Boolean(row.name && row.slug && row.count && row.count > 0),
    )
    .map((row) => ({ value: row.slug, label: row.name, count: row.count }));

  const availability: FacetOption[] = [
    { value: "available", label: "Available", count: availabilityCounts?.available ?? 0 },
    { value: "on_request", label: "On request", count: availabilityCounts?.on_request ?? 0 },
    { value: "unavailable", label: "Unavailable", count: availabilityCounts?.unavailable ?? 0 },
    {
      value: "not_confirmed",
      label: "Not confirmed",
      count: availabilityCounts?.not_confirmed ?? 0,
    },
  ].filter((option) => option.count > 0);

  const specMap = new Map<string, Map<string, number>>();
  for (const row of specRows ?? []) {
    const seenForProduct = new Set<string>();
    for (const pair of row.pairs ?? []) {
      if (!pair.name || !pair.value) continue;
      const key = `${pair.name}::${pair.value}`;
      if (seenForProduct.has(key)) continue;
      seenForProduct.add(key);
      const values = specMap.get(pair.name) ?? new Map<string, number>();
      values.set(pair.value, (values.get(pair.value) ?? 0) + 1);
      specMap.set(pair.name, values);
    }
  }

  const specs = Array.from(specMap.entries())
    .map(([name, values]) => ({
      name,
      values: Array.from(values.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter((facet) => facet.values.length > 1)
    .sort((a, b) => a.name.localeCompare(b.name));

  return { brands, availability, specs };
}

export type ProductListResult = {
  items: ProductCardData[];
  total: number;
};
