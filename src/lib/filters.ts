import { DEFAULT_LOCALE, translate, type Locale, type MessageKey } from "./i18n";
import type { Availability, SortKey } from "./types";

export type CatalogFilters = {
  q: string;
  category: string;
  brands: string[];
  availability: Availability[];
  min?: number;
  max?: number;
  specs: Array<{ name: string; value: string }>;
  sort: SortKey;
  page: number;
};

export const PAGE_SIZE = 24;

const SORT_LABEL_KEYS: Record<SortKey, MessageKey> = {
  recommended: "sortRecommended",
  "name-asc": "sortNameAsc",
  "name-desc": "sortNameDesc",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
};

const SORT_KEYS: SortKey[] = [
  "recommended",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
];

export function sortOptions(locale: Locale = DEFAULT_LOCALE): Array<{
  value: SortKey;
  label: string;
}> {
  return SORT_KEYS.map((value) => ({
    value,
    label: translate(locale, SORT_LABEL_KEYS[value]),
  }));
}

/** English fallback used where no locale is available. */
export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = SORT_KEYS.map(
  (value) => ({ value, label: translate("en", SORT_LABEL_KEYS[value]) }),
);

export const AVAILABILITY_OPTIONS: Array<{ value: Availability; label: string }> = [
  { value: "available", label: "Available" },
  { value: "on_request", label: "On request" },
  { value: "unavailable", label: "Unavailable" },
  { value: "not_confirmed", label: "Not confirmed" },
];

const VALID_AVAILABILITY = new Set<Availability>(AVAILABILITY_OPTIONS.map((item) => item.value));
const VALID_SORT = new Set<SortKey>(SORT_OPTIONS.map((item) => item.value));

type SearchParamsLike = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function many(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function numberOrUndefined(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function parseFilters(searchParams: SearchParamsLike): CatalogFilters {
  const q = single(searchParams.q).trim().slice(0, 120);
  const category = single(searchParams.category)
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");

  const brands = Array.from(
    new Set(many(searchParams.brand).map((brand) => brand.trim()).filter(Boolean)),
  );

  const availability = Array.from(
    new Set(
      many(searchParams.availability)
        .map((value) => value.trim())
        .filter((value): value is Availability => VALID_AVAILABILITY.has(value as Availability)),
    ),
  );

  const specs: Array<{ name: string; value: string }> = [];
  const seenSpecs = new Set<string>();
  for (const raw of many(searchParams.spec)) {
    const separator = raw.indexOf("::");
    if (separator < 1) continue;
    const name = raw.slice(0, separator).trim();
    const value = raw.slice(separator + 2).trim();
    if (!name || !value) continue;
    const key = `${name}::${value}`;
    if (seenSpecs.has(key)) continue;
    seenSpecs.add(key);
    specs.push({ name, value });
  }

  const sortValue = single(searchParams.sort) as SortKey;
  const sort = VALID_SORT.has(sortValue) ? sortValue : "recommended";

  const pageRaw = Number.parseInt(single(searchParams.page), 10);
  const page = Number.isFinite(pageRaw) ? Math.min(Math.max(pageRaw, 1), 5000) : 1;

  return {
    q,
    category,
    brands,
    availability,
    min: numberOrUndefined(single(searchParams.min)),
    max: numberOrUndefined(single(searchParams.max)),
    specs,
    sort,
    page,
  };
}

export function filtersToSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category.trim()) params.set("category", filters.category.trim());
  for (const brand of filters.brands) params.append("brand", brand);
  for (const value of filters.availability) params.append("availability", value);
  if (typeof filters.min === "number") params.set("min", String(filters.min));
  if (typeof filters.max === "number") params.set("max", String(filters.max));
  for (const spec of filters.specs) params.append("spec", `${spec.name}::${spec.value}`);
  if (filters.sort !== "recommended") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

export function buildCatalogHref(
  basePath: string,
  filters: CatalogFilters,
  overrides: Partial<CatalogFilters> = {},
): string {
  const merged: CatalogFilters = { ...filters, ...overrides };
  const params = filtersToSearchParams(merged);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function toggleBrand(filters: CatalogFilters, slug: string): CatalogFilters {
  const brands = filters.brands.includes(slug)
    ? filters.brands.filter((brand) => brand !== slug)
    : [...filters.brands, slug];
  return { ...filters, brands, page: 1 };
}

export function toggleAvailability(
  filters: CatalogFilters,
  value: Availability,
): CatalogFilters {
  const availability = filters.availability.includes(value)
    ? filters.availability.filter((item) => item !== value)
    : [...filters.availability, value];
  return { ...filters, availability, page: 1 };
}

export function toggleSpec(
  filters: CatalogFilters,
  name: string,
  value: string,
): CatalogFilters {
  const exists = filters.specs.some((spec) => spec.name === name && spec.value === value);
  const specs = exists
    ? filters.specs.filter((spec) => !(spec.name === name && spec.value === value))
    : [...filters.specs, { name, value }];
  return { ...filters, specs, page: 1 };
}

export function clearFilters(filters: CatalogFilters): CatalogFilters {
  return {
    ...filters,
    brands: [],
    availability: [],
    min: undefined,
    max: undefined,
    specs: [],
    page: 1,
  };
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.brands.length > 0 ||
    filters.availability.length > 0 ||
    filters.specs.length > 0 ||
    typeof filters.min === "number" ||
    typeof filters.max === "number"
  );
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    filters.brands.length +
    filters.availability.length +
    filters.specs.length +
    (typeof filters.min === "number" || typeof filters.max === "number" ? 1 : 0)
  );
}

export function sortLabel(sort: SortKey, locale: Locale = DEFAULT_LOCALE): string {
  return translate(locale, SORT_LABEL_KEYS[sort] ?? "sortRecommended");
}
