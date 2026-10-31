import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  getBrandsWithCounts,
  getCatalogue,
  getFeaturedProducts,
  getSiteSettings,
} from "@/lib/catalogue";
import { categoryHref } from "@/lib/categories";
import { getLocale } from "@/lib/locale";
import { productCountLabel, translate } from "@/lib/i18n";
import { localizedSetting } from "@/lib/settings";
import { isSanityConfigured } from "@/lib/sanity";
import type { CategoryStage } from "@/lib/types";
import { CatalogueNotice } from "@/components/catalogue-notice";
import { CategoryCard } from "@/components/category-card";
import { ContactActions } from "@/components/contact-actions";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";

const STAGES: Array<{
  key: Exclude<CategoryStage, "other">;
  title: "stageStructure" | "stageFinishing" | "stageServices";
  body: "stageStructureDesc" | "stageFinishingDesc" | "stageServicesDesc";
}> = [
  { key: "structure", title: "stageStructure", body: "stageStructureDesc" },
  { key: "finishing", title: "stageFinishing", body: "stageFinishingDesc" },
  { key: "services", title: "stageServices", body: "stageServicesDesc" },
];

const PROCESS = [
  { icon: Search, title: "step1Title", body: "step1Body" },
  { icon: PackageSearch, title: "step2Title", body: "step2Body" },
  { icon: ClipboardList, title: "step3Title", body: "step3Body" },
  { icon: MessageCircle, title: "step4Title", body: "step4Body" },
] as const;

function fallbackStage(index: number): CategoryStage {
  if (index < 4) return "structure";
  if (index < 9) return "finishing";
  return "services";
}

function SectionHeading({
  kicker,
  title,
  accent,
  intro,
  href,
  linkLabel,
}: {
  kicker: string;
  title: string;
  accent?: string;
  intro?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-10">
      <div className="max-w-2xl">
        <p className="type-eyebrow">{kicker}</p>
        <h2 className="type-h2 mt-3 text-balance text-ink">
          {title}
          {accent ? (
            <>
              {" "}
              <em className="font-normal text-clay">{accent}</em>
            </>
          ) : null}
        </h2>
        {intro ? <p className="type-lead mt-3 max-w-xl text-pretty">{intro}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="link-arrow shrink-0">
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [settings, catalogue, featured, allBrands, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCatalogue(),
    getFeaturedProducts().catch(() => []),
    getBrandsWithCounts().catch(() => []),
    getLocale(),
  ]);

  const { tree, totalProducts } = catalogue;
  const brands = allBrands.filter((brand) => (brand.count ?? 0) > 0);
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const hasCatalogue = tree.length > 0 || totalProducts > 0;
  const demo = !isSanityConfigured;
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber =
    settings?.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    null;
  const serviceArea = localizedSetting(settings, "serviceArea", locale);
  const priceNote = localizedSetting(settings, "priceNote", locale);
  const address = localizedSetting(settings, "address", locale);
  const openingHours = localizedSetting(settings, "openingHours", locale);

  const grouped = STAGES.map((stage) => ({
    ...stage,
    categories: tree.filter((category, index) => (category.stage ?? fallbackStage(index)) === stage.key),
  })).filter((group) => group.categories.length > 0);

  const findTop = (slug: string) => tree.find((category) => category.slug === slug);
  const foundation = findTop("cement-concrete") ?? tree[0];
  const flooring = findTop("stone-marble") ?? tree[1];
  const bathroom = findTop("sanitaryware") ?? tree[2];

  const collections = [
    {
      title: "homeCollectionStructureTitle" as const,
      body: "homeCollectionStructureBody" as const,
      image: "/images/site-construction.jpg",
      category: foundation,
      alt: "Construction site with concrete structure",
    },
    {
      title: "homeCollectionFinishTitle" as const,
      body: "homeCollectionFinishBody" as const,
      image: "/images/interior-finish.jpg",
      category: flooring,
      alt: "Finished interior wall and floor",
    },
    {
      title: "homeCollectionBathTitle" as const,
      body: "homeCollectionBathBody" as const,
      image: "/images/material-detail.jpg",
      category: bathroom,
      alt: "Close-up of a bathroom material detail",
    },
  ];

  return (
    <div className="paper-texture">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container">
          <div className="grid gap-10 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-14 lg:pb-20 lg:pt-20">
            <div className="flex flex-col justify-center">
              <p className="type-eyebrow animate-rise">
                {serviceArea || translate(locale, "homeHeroKicker")}
              </p>

              <h1 className="type-display mt-5 max-w-[13ch] text-balance text-ink animate-rise animate-rise-delay-1">
                {translate(locale, "homeHeroTitleLead")}{" "}
                <em className="font-normal not-italic text-clay">
                  {translate(locale, "homeHeroTitleAccent")}
                </em>
              </h1>

              <p className="type-lead mt-5 max-w-lg text-pretty animate-rise animate-rise-delay-2">
                {translate(locale, "homeHeroBody")}
              </p>

              <div className="mt-7 hidden max-w-xl animate-rise animate-rise-delay-3 sm:block">
                <SearchBox variant="page" />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2.5 animate-rise animate-rise-delay-3">
                <Link href="/categories" className="btn btn-primary btn-lg">
                  {translate(locale, "homeHeroPrimary")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <ContactActions
                  phone={phone}
                  whatsappNumber={whatsappNumber}
                  businessName={businessName}
                  className="[&_a]:!min-h-12 [&_a]:!rounded-xs [&_a]:!px-5 [&_a]:!text-sm"
                />
              </div>

              <p className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                <ShieldCheck className="h-4 w-4 text-whatsapp" aria-hidden="true" />
                {translate(locale, "homeHeroNote")}
              </p>
            </div>

            <div className="relative min-h-[26rem] sm:min-h-[32rem] lg:min-h-[38rem]">
              <div className="absolute inset-0 overflow-hidden rounded-[2px] border border-line bg-sand shadow-[var(--shadow-lift)]">
                <Image
                  src="/images/hero-architecture.jpg"
                  alt="Warm architectural facade with deep openings and textured walls"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/55 via-transparent to-forest-deep/5" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-surface sm:p-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface/85">
                    Material House / 01
                  </span>
                  <span className="h-px w-16 bg-brass" aria-hidden="true" />
                </div>
                <div className="absolute inset-x-3 bottom-3 border border-surface/20 bg-forest-deep/75 p-4 text-surface backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-5">
                  <div className="grid grid-cols-3 divide-x divide-surface/20">
                    <div className="pr-3">
                      <p className="font-display text-2xl leading-none sm:text-3xl">
                        {totalProducts.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-surface/65 sm:text-[10px]">
                        {translate(locale, "homeStatsProducts")}
                      </p>
                    </div>
                    <div className="px-3">
                      <p className="font-display text-2xl leading-none sm:text-3xl">
                        {tree.length.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-surface/65 sm:text-[10px]">
                        {translate(locale, "homeStatsCategories")}
                      </p>
                    </div>
                    <div className="pl-3">
                      <p className="font-display text-2xl leading-none sm:text-3xl">
                        {brands.length.toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-surface/65 sm:text-[10px]">
                        {translate(locale, "homeStatsBrands")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-surface/15 pt-2.5 text-[10px] font-medium tracking-wide text-surface/65">
                    {demo
                      ? translate(locale, "homeStatsDemoNote")
                      : priceNote || translate(locale, "priceNoteDefault")}
                  </p>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-2 -left-2 hidden h-24 w-24 border-b border-l border-brass/50 lg:block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Material marquee ─────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-forest-deep/20 bg-forest py-3.5 text-surface">
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <p
              key={copy}
              aria-hidden={copy === 1}
              className="whitespace-nowrap px-4 font-display text-lg font-light tracking-wide text-surface/85 sm:text-xl"
            >
              {translate(locale, "homeMarquee")}
              {"  "}
              <span className="text-brass">◆</span>
              {"  "}
              {translate(locale, "homeMarquee")}
            </p>
          ))}
        </div>
      </div>

      {!hasCatalogue ? (
        <div className="container section">
          <CatalogueNotice />
        </div>
      ) : (
        <>
          {/* ── Categories by build stage ─────────────────────────────────── */}
          <section aria-labelledby="stages" className="section">
            <div className="container">
              <SectionHeading
                kicker={translate(locale, "homeStagesKicker")}
                title={translate(locale, "homeStagesTitle")}
                accent={translate(locale, "homeStagesTitleAccent")}
                intro={translate(locale, "homeStagesIntro")}
                href="/categories"
                linkLabel={translate(locale, "homeAllCategories")}
              />

              <div id="stages" className="grid gap-8 lg:grid-cols-3 lg:gap-7">
                {grouped.map((group, groupIndex) => {
                  const [lead, ...rest] = group.categories;
                  return (
                    <div
                      key={group.key}
                      className="border-t border-ink/20 pt-5 lg:border-t-0 lg:pt-0"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[11px] tracking-[0.1em] text-clay">
                          {String(groupIndex + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
                            {translate(locale, group.title)}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                            {translate(locale, group.body)}
                          </p>
                        </div>
                      </div>

                      {lead ? (
                        <div className="mt-5">
                          <CategoryCard category={lead} featured />
                        </div>
                      ) : null}

                      {rest.length > 0 ? (
                        <ul className="mt-5 border-t border-line">
                          {rest.map((category) => (
                            <li key={category._id}>
                              <Link
                                href={categoryHref(category.path)}
                                className="group flex min-h-14 items-center justify-between gap-3 border-b border-line py-3 transition-colors hover:text-clay"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-[0.95rem] font-semibold text-ink group-hover:text-clay">
                                    {category.name}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-ink-soft">
                                    {productCountLabel(category.productCount, locale)}
                                  </span>
                                </span>
                                <ArrowUpRight
                                  className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-clay"
                                  aria-hidden="true"
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Featured products ────────────────────────────────────────── */}
          {featured.length > 0 ? (
            <section aria-labelledby="featured" className="section-sm border-y border-line bg-surface/60">
              <div className="container">
                <SectionHeading
                  kicker={translate(locale, "homeFeaturedKicker")}
                  title={translate(locale, "homeFeaturedTitle")}
                  intro={translate(locale, "homeFeaturedIntro")}
                  href="/search"
                  linkLabel={translate(locale, "homeViewAllProducts")}
                />
                <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7">
                  {featured.slice(0, 8).map((product) => (
                    <li key={product._id}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {/* ── Editorial band ───────────────────────────────────────────── */}
          <section className="section">
            <div className="container">
              <div className="grid overflow-hidden border border-forest-deep/15 bg-forest text-surface lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[20rem] lg:min-h-[34rem]">
                  <Image
                    src="/images/about-build.jpg"
                    alt="Construction detail with layered natural materials"
                    fill
                    sizes="(max-width: 1024px) 100vw, 52vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/55 to-transparent lg:bg-gradient-to-r" />
                  <p className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-surface/75 sm:bottom-6 sm:left-6">
                    Material House / 02
                  </p>
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                  <p className="type-eyebrow text-brass">{translate(locale, "homeEditorialKicker")}</p>
                  <h2 className="type-h2 mt-3 text-balance text-surface">
                    {translate(locale, "homeEditorialTitle")}
                  </h2>
                  <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-surface/75 sm:text-base">
                    {translate(locale, "homeEditorialBody")}
                  </p>
                  <ul className="mt-6 space-y-3 border-t border-surface/15 pt-5">
                    {[
                      translate(locale, "homeEditorialPoint1"),
                      translate(locale, "homeEditorialPoint2"),
                      translate(locale, "homeEditorialPoint3"),
                    ].map((point, index) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-surface/85">
                        <span className="font-mono text-[10px] text-brass">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/about"
                    className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 border-b border-surface/30 pb-1 text-sm font-bold text-surface transition-colors hover:border-brass hover:text-brass"
                  >
                    {translate(locale, "homeEditorialCta")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── Curated collections ──────────────────────────────────────── */}
          <section aria-labelledby="collections" className="section-sm border-y border-line bg-sand/45">
            <div className="container">
              <SectionHeading
                kicker={translate(locale, "homeCollectionKicker")}
                title={translate(locale, "homeCollectionTitle")}
              />
              <div id="collections" className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {collections.map((collection, index) => {
                  const href = collection.category
                    ? categoryHref(collection.category.path)
                    : "/categories";
                  return (
                    <Link
                      key={collection.title}
                      href={href}
                      className="group relative flex min-h-[20rem] flex-col justify-end overflow-hidden border border-line bg-forest text-surface sm:min-h-[24rem]"
                    >
                      <Image
                        src={collection.image}
                        alt={collection.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
                      <div className="relative p-5 sm:p-6">
                        <p className="font-mono text-[10px] tracking-[0.16em] text-brass">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="mt-2 font-display text-2xl font-medium tracking-tight">
                          {translate(locale, collection.title)}
                        </h3>
                        <p className="mt-1.5 max-w-[24ch] text-sm leading-relaxed text-surface/75">
                          {translate(locale, collection.body)}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-surface/90">
                          {translate(locale, "viewCategory")}
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Process ──────────────────────────────────────────────────── */}
          <section aria-labelledby="process" className="section">
            <div className="container">
              <SectionHeading
                kicker={translate(locale, "homeProcessKicker")}
                title={translate(locale, "homeProcessTitle")}
                intro={translate(locale, "homeProcessIntro")}
              />
              <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {PROCESS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="border-t border-ink/20 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] tracking-[0.12em] text-clay">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Icon className="h-5 w-5 text-ink-soft" aria-hidden="true" />
                      </div>
                      <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-ink">
                        {translate(locale, step.title)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                        {translate(locale, step.body)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* ── Brands ───────────────────────────────────────────────────── */}
          {brands.length > 0 ? (
            <section aria-labelledby="brands" className="section-sm border-y border-line bg-surface/70">
              <div className="container">
                <SectionHeading
                  kicker={translate(locale, "homeBrandsKicker")}
                  title={translate(locale, "homeBrandsTitle")}
                  href="/brands"
                  linkLabel={translate(locale, "allBrands")}
                />
                <ul className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-6">
                  {brands.slice(0, 12).map((brand) => (
                    <li key={brand._id} className="border-b border-r border-line">
                      <Link
                        href={`/brands/${encodeURIComponent(brand.slug)}`}
                        className="group flex min-h-24 flex-col justify-between p-4 transition-colors hover:bg-sand/60"
                      >
                        <span className="font-display text-lg font-medium tracking-tight text-ink transition-colors group-hover:text-clay">
                          {brand.name}
                        </span>
                        <span className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                          {productCountLabel(brand.count ?? 0, locale)}
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* ── Contact CTA ────────────────────────────────────────────────── */}
      <section aria-labelledby="contact-cta" className="section">
        <div className="container">
          <div className="relative overflow-hidden bg-forest px-6 py-10 text-surface sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div className="blueprint absolute inset-0 opacity-[0.14]" aria-hidden="true" />
            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <p className="type-eyebrow text-brass">{translate(locale, "homeCtaKicker")}</p>
                <h2 id="contact-cta" className="type-h2 mt-3 max-w-[20ch] text-balance text-surface">
                  {translate(locale, "homeCtaTitle")}{" "}
                  <em className="font-normal text-brass">{translate(locale, "homeCtaTitleAccent")}</em>
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-surface/75 sm:text-base">
                  {translate(locale, "homeCtaBody")}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <ContactActions
                    phone={phone}
                    whatsappNumber={whatsappNumber}
                    businessName={businessName}
                    showMissing
                    className="[&_a]:!min-h-12 [&_a]:!rounded-xs [&_a]:!px-5 [&_a]:!text-sm"
                  />
                  <Link
                    href="/enquiry"
                    className="btn btn-secondary !min-h-12 !rounded-xs !border-surface/25 !px-5 !text-sm !text-surface hover:!bg-surface/10"
                  >
                    {translate(locale, "openEnquiryList")}
                  </Link>
                </div>
              </div>

              <div className="grid gap-5 border-t border-surface/15 pt-6 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                {address ? (
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-surface/55">
                      <MapPin className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
                      {translate(locale, "footerVisit")}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-surface/85">
                      {address}
                    </p>
                  </div>
                ) : null}
                {openingHours ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-surface/55">
                      {translate(locale, "footerHours")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-surface/85">
                      {openingHours}
                    </p>
                  </div>
                ) : null}
                {serviceArea ? (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-surface/55">
                      {translate(locale, "homeServiceAreaLabel")}
                    </p>
                    <p className="mt-1 text-sm text-surface/85">{serviceArea}</p>
                  </div>
                ) : null}
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brass sm:col-span-2"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {phone}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {demo ? (
        <div className="container pb-12">
          <p className="border-t border-line pt-5 text-center text-[11px] leading-relaxed text-ink-faint">
            {translate(locale, "homeDemoNotice")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
