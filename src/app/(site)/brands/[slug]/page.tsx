import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Globe } from "lucide-react";
import { getBrandBySlug, getProductList } from "@/lib/catalogue";
import { PAGE_SIZE, parseFilters, sortLabel } from "@/lib/filters";
import { brandMonogram } from "@/lib/format";
import { productCountLabel, translate } from "@/lib/i18n";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import type { CatalogQueryInput } from "@/lib/queries";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";

type PageParams = PageProps<"/brands/[slug]">;

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([props.params, getLocale()]);
  const brand = await getBrandBySlug(slug);
  if (!brand) return { title: translate(locale, "notFoundTitle") };

  return {
    title: brand.name,
    description:
      brand.description?.trim() || `${brand.name}. ${translate(locale, "priceNoteDefault")}`,
    alternates: { canonical: `/brands/${brand.slug}` },
  };
}

export default async function BrandPage(props: PageParams) {
  const [{ slug }, searchParams, locale] = await Promise.all([
    props.params,
    props.searchParams,
    getLocale(),
  ]);
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const filters = parseFilters(searchParams);

  const input: CatalogQueryInput = {
    q: filters.q || null,
    brandSlugs: [brand.slug],
    availability: filters.availability,
    minPrice: filters.min ?? null,
    maxPrice: filters.max ?? null,
    specs: filters.specs,
    sort: filters.sort,
    page: filters.page,
    pageSize: PAGE_SIZE,
  };

  const result = await getProductList(input);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const basePath = `/brands/${encodeURIComponent(brand.slug)}`;
  const logo = imageUrl(brand.logo, { width: 320, height: 180 });

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: translate(locale, "brands"), href: "/brands" },
              { label: brand.name },
            ]}
            className="pt-2"
          />
          <Link href="/brands" className="link-quiet mb-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {translate(locale, "allBrands")}
          </Link>

          <div className="grid gap-8 pb-10 pt-2 sm:pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <p className="type-eyebrow">{translate(locale, "brandLabel")}</p>
              <h1 className="type-h1 mt-3 max-w-[18ch] text-balance text-ink">{brand.name}</h1>
              {brand.description ? (
                <p className="type-lead mt-3 max-w-xl text-pretty">{brand.description}</p>
              ) : (
                <p className="type-lead mt-3 max-w-xl text-pretty">
                  {translate(locale, "priceNoteDefault")}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
                <span className="font-semibold text-ink">
                  {productCountLabel(result.total, locale)}
                </span>
                {brand.website ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-ink-faint" aria-hidden="true" />
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-ink-soft underline-offset-2 hover:text-primary-deep hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      {translate(locale, "viewBrandWebsite")}
                    </a>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex min-h-32 items-center justify-center border border-line bg-surface p-6 lg:min-h-40">
              {logo ? (
                <Image
                  src={logo}
                  alt={brand.logo?.alt?.trim() || brand.name}
                  width={320}
                  height={180}
                  className="max-h-24 w-auto object-contain"
                />
              ) : (
                <span className="font-display text-7xl font-medium tracking-tight text-ink-soft/45">
                  {brandMonogram(brand.name)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container section-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <p className="text-xs text-ink-soft">
            <span className="font-semibold text-ink">
              {productCountLabel(result.total, locale)}
            </span>{" "}
            · {brand.name}
            {result.total > 0 ? ` · ${sortLabel(filters.sort, locale)}` : ""}
          </p>
          {result.total > 0 ? <SortSelect basePath={basePath} filters={filters} /> : null}
        </div>

        {result.items.length > 0 ? (
          <>
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {result.items.map((product) => (
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
            <p className="mt-6 text-sm text-ink-soft">
              {translate(locale, "lookingForAnotherBrand")}{" "}
              <Link href="/brands" className="link-arrow ml-1 inline-flex">
                {translate(locale, "allBrands")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </>
        ) : (
          <div className="mt-6 border border-line bg-surface px-6 py-12 text-center">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              {translate(locale, "brandNoProducts", { brand: brand.name })}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              {translate(locale, "noProductsBody")}
            </p>
            <Link href="/search" className="btn btn-primary mt-6">
              {translate(locale, "browseAllProducts")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
