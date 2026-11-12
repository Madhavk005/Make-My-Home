import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import {
  getAllBrands,
  getCategoryPageData,
  getFacets,
  getProductList,
  getSiteSettings,
  resolveCategoryLegacyPath,
} from "@/lib/catalogue";
import { categoryHref, categoryIdsMatchingQuery } from "@/lib/categories";
import { PAGE_SIZE, parseFilters } from "@/lib/filters";
import { productCountLabel, subCategoryCountLabel, translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { imageUrl } from "@/lib/image";
import { getSiteOrigin } from "@/lib/site-origin";
import { materialArt } from "@/lib/material-art";
import type { CatalogQueryInput } from "@/lib/queries";
import { isDemoDataEnabled } from "@/lib/sanity";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogResults } from "@/components/catalog-results";
import { CategoryCard } from "@/components/category-card";

export async function generateMetadata(
  props: PageProps<"/category/[...slug]">,
): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([props.params, getLocale()]);
  const data = await getCategoryPageData(slug);
  if (!data) return { title: translate(locale, "notFoundTitle") };

  const title = data.category.seoTitle?.trim() || data.category.name;
  const description =
    data.category.seoDescription?.trim() ||
    data.category.description?.trim() ||
    `${data.category.name}. ${translate(locale, "priceNoteDefault")}`;
  const image = imageUrl(data.category.image, { width: 1200, height: 630 });

  return {
    title,
    description,
    alternates: { canonical: categoryHref(data.category.path) },
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: data.category.name }] } : {}),
    },
  };
}

export default async function CategoryPage(props: PageProps<"/category/[...slug]">) {
  const [{ slug }, searchParams, locale] = await Promise.all([
    props.params,
    props.searchParams,
    getLocale(),
  ]);
  const data = await getCategoryPageData(slug);

  if (!data) {
    // Old category URLs keep working when an ancestor was reorganised. Slugs
    // are globally unique, so the final segment identifies the new path.
    const legacy = await resolveCategoryLegacyPath(slug);
    if (legacy) permanentRedirect(categoryHref(legacy.path));
    notFound();
  }

  const { category, categoryIds, categories, children, breadcrumb, totalProducts } = data;
  const parsed = parseFilters(searchParams);
  const filters = { ...parsed, category: "" };
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

  const [result, facets, brands, settings] = await Promise.all([
    getProductList(input),
    getFacets(input),
    getAllBrands(),
    getSiteSettings().catch(() => null),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const crumbs = breadcrumb.map((node) => ({
    label: node.name,
    href: node._id === category._id ? undefined : categoryHref(node.path),
  }));

  const parent = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : null;
  const backHref = parent ? categoryHref(parent.path) : "/categories";
  const backLabel = parent ? parent.name : translate(locale, "categories");
  const demo = isDemoDataEnabled;
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const art = materialArt(category.slug, category.name);

  const origin = getSiteOrigin();
  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((node, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: node.name,
          item: new URL(categoryHref(node.path), origin).toString(),
        })),
      },
      {
        "@type": "CollectionPage",
        name: category.seoTitle?.trim() || category.name,
        description:
          category.seoDescription?.trim() ||
          category.description?.trim() ||
          category.name,
        url: new URL(categoryHref(category.path), origin).toString(),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: result.total,
          itemListElement: result.items.slice(0, 12).map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.name,
            url: new URL(`/product/${encodeURIComponent(product.slug)}`, origin).toString(),
          })),
        },
      },
    ],
  };

  const categoryLabel =
    category.level === "primary"
      ? translate(locale, "categoryKicker")
      : translate(locale, "categoryLabel");

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs items={crumbs} className="pt-2" />

          <Link href={backHref} className="link-quiet mb-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {translate(locale, "back")} · {backLabel}
          </Link>

          <div className="grid gap-8 pb-10 pt-2 sm:pb-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-14">
            <div>
              <p className="type-eyebrow">{categoryLabel}</p>
              <h1 className="type-h1 mt-3 max-w-[20ch] text-balance text-ink">{category.name}</h1>
              {category.description ? (
                <p className="type-lead mt-4 max-w-2xl text-pretty">{category.description}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
                <span className="font-semibold text-ink">
                  {productCountLabel(totalProducts, locale)}
                </span>
                {children.length > 0 ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-ink-faint" aria-hidden="true" />
                    <span>{subCategoryCountLabel(children.length, locale)}</span>
                  </>
                ) : null}
                <span className="h-1 w-1 rounded-full bg-ink-faint" aria-hidden="true" />
                <span>{translate(locale, "priceNoteDefault")}</span>
              </div>
            </div>

            <div className="relative hidden min-h-44 overflow-hidden border border-line bg-sand lg:block">
              <Image
                src={art}
                alt=""
                fill
                sizes="34vw"
                className="object-cover"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-surface">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-surface/80">
                  {businessName}
                </p>
                <p className="font-display text-lg">{translate(locale, "categoryProductsTitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container section-sm">
        {children.length > 0 ? (
          <section aria-labelledby="sub-categories" className="mb-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="type-eyebrow">{translate(locale, "categorySubTitle")}</p>
                <h2
                  id="sub-categories"
                  className="mt-2 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
                >
                  {translate(locale, "subSections")}
                </h2>
              </div>
              <p className="text-xs text-ink-soft">{translate(locale, "categoryFilterHint")}</p>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
              {children.map((child) => (
                <li key={child._id}>
                  <CategoryCard category={child} />
                  {child.children.length > 0 ? (
                    <ul className="mt-2 grid gap-x-2 gap-y-0.5 border-t border-line-soft pt-2">
                      {child.children.map((tertiary) => (
                        <li key={tertiary._id}>
                          <Link
                            href={categoryHref(tertiary.path)}
                            className="inline-flex min-h-7 items-center text-[11px] text-ink-soft transition-colors hover:text-primary-deep"
                          >
                            {tertiary.name}
                            {tertiary.productCount > 0 ? (
                              <span className="ml-1.5 font-mono text-[11px] text-ink-faint">
                                {tertiary.productCount}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="category-products">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="type-eyebrow">{translate(locale, "categoryProductsTitle")}</p>
              <h2
                id="category-products"
                className="mt-2 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
              >
                {translate(locale, "productsInSection", { count: result.total })}
              </h2>
            </div>
            {demo ? (
              <span className="rounded-full border border-primary/30 bg-accent-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-accent-dark">
                {translate(locale, "categoryDemoNote")}
              </span>
            ) : null}
          </div>

          <CatalogResults
            basePath={categoryHref(category.path)}
            filters={filters}
            products={result.items}
            total={result.total}
            totalPages={totalPages}
            facets={facets}
            brands={brands}
            emptyTitle={translate(locale, "categoryNoProductsTitle")}
            emptyBody={
              children.length > 0
                ? translate(locale, "categoryNoProductsBody")
                : translate(locale, "noProductsBody")
            }
          />

          <div className="mt-14 flex flex-col justify-between gap-4 border-t border-line pt-7 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl text-ink">{translate(locale, "homeAskAnything")}</p>
              <p className="mt-1 text-sm text-ink-soft">{translate(locale, "homeAskAnythingBody")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/contact" className="btn btn-secondary">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {translate(locale, "navContact")}
              </Link>
              <Link href="/search" className="btn btn-primary">
                {translate(locale, "browseAllProducts")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
