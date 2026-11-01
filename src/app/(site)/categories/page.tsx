import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getBrandsWithCounts, getCatalogue, getSiteSettings } from "@/lib/catalogue";
import { categoryHref } from "@/lib/categories";
import { getLocale } from "@/lib/locale";
import { productCountLabel, translate } from "@/lib/i18n";
import type { CategoryStage } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryCard } from "@/components/category-card";
import { SearchBox } from "@/components/search-box";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "categories"),
    description: translate(locale, "categoriesIntro"),
    alternates: { canonical: "/categories" },
  };
}

const STAGES: Array<{
  key: Exclude<CategoryStage, "other">;
  title: "stageStructure" | "stageFinishing" | "stageServices";
  body: "stageStructureDesc" | "stageFinishingDesc" | "stageServicesDesc";
}> = [
  { key: "structure", title: "stageStructure", body: "stageStructureDesc" },
  { key: "finishing", title: "stageFinishing", body: "stageFinishingDesc" },
  { key: "services", title: "stageServices", body: "stageServicesDesc" },
];

function fallbackStage(index: number): CategoryStage {
  if (index < 4) return "structure";
  if (index < 9) return "finishing";
  return "services";
}

export default async function CategoriesPage() {
  const [settings, catalogue, brands, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCatalogue(),
    getBrandsWithCounts().catch(() => []),
    getLocale(),
  ]);

  const { tree, totalProducts } = catalogue;
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const groups = STAGES.map((stage) => ({
    ...stage,
    categories: tree.filter(
      (category, index) => (category.stage ?? fallbackStage(index)) === stage.key,
    ),
  })).filter((group) => group.categories.length > 0);
  const other = tree.filter((category, index) => {
    const stage = category.stage ?? fallbackStage(index);
    return stage === "other";
  });

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: translate(locale, "home"), href: "/" },
              { label: translate(locale, "categories") },
            ]}
            className="pt-2"
          />
          <div className="grid gap-8 pb-10 pt-6 sm:pb-14 sm:pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <p className="type-eyebrow">{translate(locale, "categoriesKicker")}</p>
              <h1 className="type-h1 mt-3 max-w-[16ch] text-balance text-ink">
                {translate(locale, "categoriesTitle")}
              </h1>
              <p className="type-lead mt-4 max-w-xl text-pretty">
                {translate(locale, "categoriesIntro")}
              </p>
            </div>
            <div className="lg:pb-1">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                {translate(locale, "categoriesSearchTitle")}
              </p>
              <SearchBox variant="page" />
              <div className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line py-3">
                <div className="pr-3">
                  <p className="font-display text-2xl leading-none text-ink">{totalProducts}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                    {translate(locale, "homeStatsProducts")}
                  </p>
                </div>
                <div className="px-3">
                  <p className="font-display text-2xl leading-none text-ink">{tree.length}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                    {translate(locale, "homeStatsCategories")}
                  </p>
                </div>
                <div className="pl-3">
                  <p className="font-display text-2xl leading-none text-ink">
                    {brands.filter((brand) => (brand.count ?? 0) > 0).length}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                    {translate(locale, "homeStatsBrands")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {tree.length === 0 ? (
        <div className="container section">
          <div className="border border-line bg-surface p-10 text-center">
            <h2 className="type-h3 text-ink">{translate(locale, "setupEmptyTitle")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              {translate(locale, "setupEmptyBody")}
            </p>
            <Link href="/contact" className="btn btn-primary mt-6">
              {translate(locale, "navContact")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="container section">
          {groups.map((group, groupIndex) => (
            <section
              key={group.key}
              aria-labelledby={`stage-${group.key}`}
              className={groupIndex > 0 ? "mt-14 border-t border-line pt-10 sm:mt-20" : ""}
            >
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-2xl items-start gap-4">
                  <span className="mt-1 font-mono text-xs tracking-[0.12em] text-forest">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2
                      id={`stage-${group.key}`}
                      className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
                    >
                      {translate(locale, group.title)}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                      {translate(locale, group.body)}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-faint">
                  {productCountLabel(
                    group.categories.reduce((total, category) => total + category.productCount, 0),
                    locale,
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-7">
                {group.categories.map((category) => (
                  <div key={category._id} className="flex flex-col">
                    <CategoryCard category={category} />
                    {category.children.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line-soft pt-2.5">
                        {category.children.slice(0, 4).map((child) => (
                          <li key={child._id}>
                            <Link
                              href={categoryHref(child.path)}
                              className="inline-flex min-h-8 items-center text-[11px] font-medium text-ink-soft transition-colors hover:text-forest"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                        {category.children.length > 4 ? (
                          <li>
                            <Link
                              href={categoryHref(category.path)}
                              className="inline-flex min-h-8 items-center gap-1 text-[11px] font-bold text-forest"
                            >
                              +{category.children.length - 4}
                            </Link>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {other.length > 0 ? (
            <section className="mt-14 border-t border-line pt-10">
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                {translate(locale, "stageOther")}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {other.map((category) => (
                  <li key={category._id}>
                    <Link
                      href={categoryHref(category.path)}
                      className="flex min-h-14 items-center justify-between gap-3 border border-line bg-surface px-4 py-3 transition-colors hover:border-clay/40 hover:bg-sand/40"
                    >
                      <span className="text-sm font-semibold text-ink">{category.name}</span>
                      <span className="flex items-center gap-2 text-[11px] text-ink-soft">
                        {productCountLabel(category.productCount, locale)}
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-16 flex flex-col justify-between gap-5 border-t border-line pt-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl text-ink">{translate(locale, "categoriesBrowseBrands")}</p>
              <p className="mt-1 text-sm text-ink-soft">{translate(locale, "brandsIntro")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/brands" className="btn btn-secondary">
                {translate(locale, "allBrands")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/search" className="btn btn-primary">
                {translate(locale, "browseAllProducts")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          {businessName ? (
            <p className="mt-8 text-center text-[11px] text-ink-faint">
              {businessName} · {translate(locale, "footerIndicative")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
