import Link from "next/link";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { availabilityMeta, formatINR } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import {
  activeFilterCount,
  buildCatalogHref,
  clearFilters,
  hasActiveFilters,
  toggleAvailability,
  toggleBrand,
  toggleSpec,
  type CatalogFilters,
} from "@/lib/filters";
import type { Availability, Brand, CategoryNode, Facets } from "@/lib/types";
import { flattenCategoryTree } from "@/lib/categories";

type FilterPanelProps = {
  basePath: string;
  filters: CatalogFilters;
  facets: Facets;
  brands: Brand[];
  /** Shown on the global search page so shoppers can narrow by section. */
  categoryOptions?: CategoryNode[];
  showCategoryFilter?: boolean;
  /** Keeps form ids unique when the panel is rendered for mobile and desktop. */
  idPrefix?: string;
};

function OptionRow({
  href,
  active,
  label,
  count,
  indent = 0,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
  indent?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        className="group flex min-h-10 items-center gap-2.5 rounded-sm py-1.5 pr-2 text-sm text-ink-soft transition-colors hover:bg-sand/50 hover:text-ink"
        aria-current={active ? "true" : undefined}
      >
        <span
          aria-hidden="true"
          className={`grid h-4 w-4 shrink-0 place-items-center border transition-colors ${
            active
              ? "border-primary bg-accent text-charcoal"
              : "border-line bg-surface group-hover:border-ink/40"
          }`}
        >
          {active ? <Check className="h-3 w-3" /> : null}
        </span>
        <span
          className={`min-w-0 flex-1 ${active ? "font-semibold text-ink" : ""}`}
          style={indent > 0 ? { paddingLeft: `${indent * 10}px` } : undefined}
        >
          {label}
        </span>
        {typeof count === "number" ? (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-faint">{count}</span>
        ) : null}
      </Link>
    </li>
  );
}

async function FilterGroups({
  basePath,
  filters,
  facets,
  brands,
  categoryOptions,
  showCategoryFilter,
  idPrefix = "filters",
}: FilterPanelProps) {
  const locale = await getLocale();
  const brandNames = new Map(brands.map((brand) => [brand.slug, brand.name]));
  const minPriceId = `${idPrefix}-filter-min`;
  const maxPriceId = `${idPrefix}-filter-max`;

  // Keep selected values visible even when the current filters leave them with
  // no matching products, so they can always be switched off again.
  const brandOptions = [...facets.brands];
  for (const slug of filters.brands) {
    if (!brandOptions.some((option) => option.value === slug)) {
      brandOptions.push({ value: slug, label: brandNames.get(slug) ?? slug, count: 0 });
    }
  }

  const availabilityOptions = [...facets.availability];
  for (const value of filters.availability) {
    if (!availabilityOptions.some((option) => option.value === value)) {
      availabilityOptions.push({
        value,
        label: availabilityMeta(value, locale).label,
        count: 0,
      });
    }
  }

  const specFacets = facets.specs.map((facet) => {
    const values = [...facet.values];
    for (const spec of filters.specs) {
      if (spec.name === facet.name && !values.some((value) => value.value === spec.value)) {
        values.push({ value: spec.value, label: spec.value, count: 0 });
      }
    }
    return { ...facet, values };
  });

  const clearHref = buildCatalogHref(basePath, clearFilters(filters));
  const groupClass = "border-t border-line pt-4";
  const legendClass =
    "mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint";

  return (
    <div className="space-y-5">
      {hasActiveFilters(filters) ? (
        <Link
          href={clearHref}
          scroll={false}
          className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primary-deep transition-colors hover:text-primary-deep"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {translate(locale, "clearFilters")}
        </Link>
      ) : null}

      {showCategoryFilter && categoryOptions && categoryOptions.length > 0 ? (
        <fieldset className={groupClass}>
          <legend className={legendClass}>{translate(locale, "section")}</legend>
          <ul>
            {flattenCategoryTree(categoryOptions).map((category) => {
              const path = category.path.join("/");
              const active = filters.category === path;
              return (
                <OptionRow
                  key={category._id}
                  href={buildCatalogHref(basePath, filters, {
                    category: active ? "" : path,
                    page: 1,
                  })}
                  active={active}
                  label={category.name}
                  count={category.productCount}
                  indent={category.depth}
                />
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      {brandOptions.length > 0 ? (
        <fieldset className={groupClass}>
          <legend className={legendClass}>{translate(locale, "brand")}</legend>
          <ul>
            {brandOptions.map((option) => (
              <OptionRow
                key={option.value}
                href={buildCatalogHref(basePath, toggleBrand(filters, option.value))}
                active={filters.brands.includes(option.value)}
                label={option.label}
                count={option.count}
              />
            ))}
          </ul>
        </fieldset>
      ) : null}

      {availabilityOptions.length > 0 ? (
        <fieldset className={groupClass}>
          <legend className={legendClass}>{translate(locale, "availability")}</legend>
          <ul>
            {availabilityOptions.map((option) => (
              <OptionRow
                key={option.value}
                href={buildCatalogHref(
                  basePath,
                  toggleAvailability(filters, option.value as Availability),
                )}
                active={filters.availability.includes(option.value as Availability)}
                label={availabilityMeta(option.value as Availability, locale).label}
                count={option.count}
              />
            ))}
          </ul>
        </fieldset>
      ) : null}

      <fieldset className={groupClass}>
        <legend className={legendClass}>{translate(locale, "pricePerUnit")}</legend>
        <form action={basePath} method="get" className="mt-1.5">
          {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
          {filters.category ? (
            <input type="hidden" name="category" value={filters.category} />
          ) : null}
          {filters.brands.map((brand) => (
            <input key={`b-${brand}`} type="hidden" name="brand" value={brand} />
          ))}
          {filters.availability.map((value) => (
            <input key={`a-${value}`} type="hidden" name="availability" value={value} />
          ))}
          {filters.specs.map((spec) => (
            <input
              key={`s-${spec.name}-${spec.value}`}
              type="hidden"
              name="spec"
              value={`${spec.name}::${spec.value}`}
            />
          ))}
          {filters.sort !== "recommended" ? (
            <input type="hidden" name="sort" value={filters.sort} />
          ) : null}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="sr-only" htmlFor={minPriceId}>
                {translate(locale, "minPrice")}
              </label>
              <input
                id={minPriceId}
                name="min"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder={translate(locale, "minPrice")}
                defaultValue={typeof filters.min === "number" ? filters.min : ""}
                className="h-10 w-full min-w-0 border border-line bg-surface px-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="sr-only" htmlFor={maxPriceId}>
                {translate(locale, "maxPrice")}
              </label>
              <input
                id={maxPriceId}
                name="max"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder={translate(locale, "maxPrice")}
                defaultValue={typeof filters.max === "number" ? filters.max : ""}
                className="h-10 w-full min-w-0 border border-line bg-surface px-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-1.5 w-full !rounded-xs">
            {translate(locale, "apply")}
          </button>
          {typeof filters.min === "number" || typeof filters.max === "number" ? (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
              {translate(locale, "showPriceRange", {
                min:
                  typeof filters.min === "number"
                    ? formatINR(filters.min)
                    : translate(locale, "anyPrice"),
                max:
                  typeof filters.max === "number"
                    ? formatINR(filters.max)
                    : translate(locale, "anyPrice"),
              })}
            </p>
          ) : null}
        </form>
      </fieldset>

      {specFacets.length > 0 ? (
        <div className="space-y-5">
          {specFacets.map((facet) => (
            <fieldset key={facet.name} className={groupClass}>
              {/* Specification names stay exactly as the business supplied them. */}
              <legend className={legendClass}>{facet.name}</legend>
              <ul>
                {facet.values.map((option) => (
                  <OptionRow
                    key={option.value}
                    href={buildCatalogHref(basePath, toggleSpec(filters, facet.name, option.value))}
                    active={filters.specs.some(
                      (spec) => spec.name === facet.name && spec.value === option.value,
                    )}
                    label={option.label}
                    count={option.count}
                  />
                ))}
              </ul>
            </fieldset>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export async function FilterPanel(props: FilterPanelProps) {
  const locale = await getLocale();
  const count = activeFilterCount(props.filters);

  return (
    <>
      <details className="border border-line bg-surface lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {translate(locale, "filters")}
            {count > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold leading-none text-charcoal">
                {count}
              </span>
            ) : null}
          </span>
          <span className="text-[11px] font-normal text-ink-faint">
            {translate(locale, "tapToOpen")}
          </span>
        </summary>
        <div className="border-t border-line px-4 py-5">
          <FilterGroups {...props} idPrefix="filters-mobile" />
        </div>
      </details>

      <aside className="hidden lg:block" aria-label={translate(locale, "productFilters")}>
        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 no-scrollbar">
          <p className="mb-3 flex items-center gap-2 font-display text-lg font-medium tracking-tight text-ink">
            <SlidersHorizontal className="h-4 w-4 text-ink-soft" aria-hidden="true" />
            {translate(locale, "filters")}
            {count > 0 ? (
              <span className="ml-auto font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-primary-deep">
                {count}
              </span>
            ) : null}
          </p>
          <FilterGroups {...props} idPrefix="filters-desktop" />
        </div>
      </aside>
    </>
  );
}

export async function ActiveFilterChips({
  basePath,
  filters,
  brands,
}: Pick<FilterPanelProps, "basePath" | "filters" | "brands">) {
  const locale = await getLocale();
  const brandNames = new Map(brands.map((brand) => [brand.slug, brand.name]));
  const chips: Array<{ key: string; label: string; href: string }> = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `“${filters.q}”`,
      href: buildCatalogHref(basePath, filters, { q: "", page: 1 }),
    });
  }

  if (filters.category) {
    chips.push({
      key: "category",
      label: filters.category.split("/").pop() ?? filters.category,
      href: buildCatalogHref(basePath, filters, { category: "", page: 1 }),
    });
  }

  for (const slug of filters.brands) {
    chips.push({
      key: `brand-${slug}`,
      label: brandNames.get(slug) ?? slug,
      href: buildCatalogHref(basePath, toggleBrand(filters, slug)),
    });
  }

  for (const value of filters.availability) {
    chips.push({
      key: `availability-${value}`,
      label: availabilityMeta(value, locale).label,
      href: buildCatalogHref(basePath, toggleAvailability(filters, value)),
    });
  }

  for (const spec of filters.specs) {
    chips.push({
      key: `spec-${spec.name}-${spec.value}`,
      label: `${spec.name}: ${spec.value}`,
      href: buildCatalogHref(basePath, toggleSpec(filters, spec.name, spec.value)),
    });
  }

  if (typeof filters.min === "number" || typeof filters.max === "number") {
    chips.push({
      key: "price",
      label: `${typeof filters.min === "number" ? formatINR(filters.min) : translate(locale, "anyPrice")} – ${
        typeof filters.max === "number" ? formatINR(filters.max) : translate(locale, "anyPrice")
      }`,
      href: buildCatalogHref(basePath, filters, { min: undefined, max: undefined, page: 1 }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={chip.href}
            scroll={false}
            className="inline-flex min-h-9 items-center gap-1.5 border border-line bg-surface px-2.5 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary-deep"
          >
            {chip.label}
            <X className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
            <span className="sr-only">{translate(locale, "removeFilter")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
