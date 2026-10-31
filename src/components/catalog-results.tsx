import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { filterCountLabel, productCountLabel, translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import {
  activeFilterCount,
  buildCatalogHref,
  hasActiveFilters,
  type CatalogFilters,
} from "@/lib/filters";
import type { Brand, CategoryNode, Facets, ProductCardData } from "@/lib/types";
import { ActiveFilterChips, FilterPanel } from "./catalog-filters";
import { Pagination } from "./pagination";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";

type CatalogResultsProps = {
  basePath: string;
  filters: CatalogFilters;
  products: ProductCardData[];
  total: number;
  totalPages: number;
  facets: Facets;
  brands: Brand[];
  categoryOptions?: CategoryNode[];
  showCategoryFilter?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
};

export async function CatalogResults({
  basePath,
  filters,
  products,
  total,
  totalPages,
  facets,
  brands,
  categoryOptions,
  showCategoryFilter = false,
  emptyTitle,
  emptyBody,
}: CatalogResultsProps) {
  const locale = await getLocale();
  const filtered = hasActiveFilters(filters) || Boolean(filters.q);
  const filterCount = activeFilterCount(filters);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[268px_minmax(0,1fr)]">
      <FilterPanel
        basePath={basePath}
        filters={filters}
        facets={facets}
        brands={brands}
        categoryOptions={categoryOptions}
        showCategoryFilter={showCategoryFilter}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <p className="text-xs text-ink-soft" aria-live="polite">
            <span className="font-semibold text-ink">{productCountLabel(total, locale)}</span>
            {filterCount > 0 ? ` · ${filterCountLabel(filterCount, locale)}` : ""}
          </p>
          <SortSelect basePath={basePath} filters={filters} />
        </div>

        <div className="mt-3">
          <ActiveFilterChips basePath={basePath} filters={filters} brands={brands} />
        </div>

        {products.length > 0 ? (
          <>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <li key={product._id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
            <Pagination
              basePath={basePath}
              filters={filters}
              page={filters.page}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="mt-6 border border-line bg-surface px-6 py-12 text-center sm:px-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-line bg-sand text-ink-soft">
              <PackageSearch className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-medium tracking-tight text-ink">
              {emptyTitle ||
                (filtered ? translate(locale, "noResultsTitle") : translate(locale, "noProductsTitle"))}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              {emptyBody ||
                (filtered ? translate(locale, "noResultsBody") : translate(locale, "noProductsBody"))}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {filtered ? (
                <Link
                  href={buildCatalogHref(basePath, filters, {
                    q: "",
                    brands: [],
                    availability: [],
                    min: undefined,
                    max: undefined,
                    specs: [],
                    category: "",
                    page: 1,
                  })}
                  className="btn btn-primary"
                >
                  {translate(locale, "clearFilters")}
                </Link>
              ) : null}
              <Link href="/search" className="btn btn-secondary">
                {translate(locale, "browseAllProducts")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
