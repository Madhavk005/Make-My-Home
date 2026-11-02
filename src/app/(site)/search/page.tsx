import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAllBrands, getCatalogue, getFacets, getProductList } from "@/lib/catalogue";
import {
  categoryHref,
  categoryIdsMatchingQuery,
  descendantIds,
  findCategoryByPath,
  flattenCategoryTree,
} from "@/lib/categories";
import { hasActiveFilters, PAGE_SIZE, parseFilters } from "@/lib/filters";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import type { CatalogQueryInput } from "@/lib/queries";
import { isSanityConfigured } from "@/lib/sanity";
import { suggestTerms } from "@/lib/search";
import { CatalogueNotice } from "@/components/catalogue-notice";
import { CatalogResults } from "@/components/catalog-results";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchBox } from "@/components/search-box";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "searchLabel"),
    description: translate(locale, "searchHint"),
  };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const [searchParams, locale] = await Promise.all([props.searchParams, getLocale()]);
  const filters = parseFilters(searchParams);

  const [catalogue, brands] = await Promise.all([getCatalogue(), getAllBrands()]);
  const { categories, tree, totalProducts } = catalogue;

  let categoryIds: string[] | null = null;
  let categoryName: string | null = null;
  if (filters.category) {
    const node = findCategoryByPath(tree, filters.category.split("/"));
    if (node) {
      categoryName = node.name;
      categoryIds = descendantIds(categories, node._id);
    } else {
      categoryIds = ["__unknown-category__"];
    }
  }

  const searchCategoryIds = filters.q
    ? categoryIdsMatchingQuery(categories, filters.q)
    : [];

  const input: CatalogQueryInput = {
    categoryIds,
    searchCategoryIds,
    q: filters.q || null,
    brandSlugs: filters.brands,
    availability: filters.availability,
    minPrice: filters.min ?? null,
    maxPrice: filters.max ?? null,
    specs: filters.specs,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };

  const [result, facets] = await Promise.all([
    getProductList(input),
    getFacets(input, { includeSpecs: Boolean(categoryIds) }),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  let suggestedTerms: string[] = [];
  if (filters.q && result.total === 0) {
    const all = await getProductList({
      sort: "recommended",
      page: 1,
      pageSize: 1000,
    });
    suggestedTerms = suggestTerms(
      filters.q,
      [
        ...all.items.map((product) => product.name),
        ...brands.map((brand) => brand.name),
        ...flattenCategoryTree(tree).map((category) => category.name),
      ],
      5,
    );
  }

  const catalogueEmpty =
    isSanityConfigured && totalProducts === 0 && !filters.q && !hasActiveFilters(filters);
  const demo = !isSanityConfigured;
  const quickCategories = tree.slice(0, 6);

  const pageTitle = filters.q
    ? translate(locale, "searchResultsFor", { query: filters.q })
    : categoryName
      ? categoryName
      : translate(locale, "searchAll");

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs
            items={[{ label: translate(locale, "allProducts") }]}
            className="pt-2"
          />
          <div className="grid gap-8 pb-9 pt-5 sm:pb-12 sm:pt-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <p className="type-eyebrow">{translate(locale, "searchKicker")}</p>
              <h1 className="type-h1 mt-3 max-w-[24ch] text-balance text-ink">{pageTitle}</h1>
              <p className="type-lead mt-3 max-w-xl text-pretty">
                {translate(locale, "searchPageIntro")}
              </p>
            </div>
            <div>
              <SearchBox variant="page" initialQuery={filters.q} autoSubmit />
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {translate(locale, "searchPopular")}
                </span>
                {quickCategories.map((category) => (
                  <Link
                    key={category._id}
                    href={categoryHref(category.path)}
                    className="chip !min-h-8 !px-2.5 !text-[11px]"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container section-sm">
        {demo ? (
          <p className="mb-5 border-l-2 border-brass pl-3 text-[11px] leading-relaxed text-ink-soft">
            {translate(locale, "searchDemoNote")}
          </p>
        ) : null}

        {suggestedTerms.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-soft">Did you mean:</span>
            {suggestedTerms.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {term}
              </Link>
            ))}
          </div>
        ) : null}

        {catalogueEmpty ? (
          <CatalogueNotice empty className="mt-2" />
        ) : (
          <CatalogResults
            basePath="/search"
            filters={filters}
            products={result.items}
            total={result.total}
            totalPages={totalPages}
            facets={facets}
            brands={brands}
            categoryOptions={tree}
            showCategoryFilter
          />
        )}

        {!filters.q && !hasActiveFilters(filters) ? (
          <section aria-labelledby="browse-categories" className="mt-14 border-t border-line pt-8">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="type-eyebrow">{translate(locale, "homeBrowseCategories")}</p>
                <h2
                  id="browse-categories"
                  className="mt-2 font-display text-2xl font-medium tracking-tight text-ink"
                >
                  {translate(locale, "homeSectionsTitle")}
                </h2>
              </div>
              <Link href="/categories" className="link-arrow">
                {translate(locale, "viewAll")}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {quickCategories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={categoryHref(category.path)}
                    className="flex min-h-20 flex-col justify-between border border-line bg-surface p-3.5 transition-colors hover:border-clay/40 hover:bg-sand/40"
                  >
                    <span className="text-sm font-semibold leading-snug text-ink">{category.name}</span>
                    <span className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                      {category.productCount}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
