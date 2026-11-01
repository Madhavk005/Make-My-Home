import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { getBrandsWithCounts, getSiteSettings } from "@/lib/catalogue";
import { brandMonogram } from "@/lib/format";
import { productCountLabel, translate } from "@/lib/i18n";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CatalogueNotice } from "@/components/catalogue-notice";
import { ContactActions } from "@/components/contact-actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "brands"),
    description: translate(locale, "brandsIntro"),
    alternates: { canonical: "/brands" },
  };
}

export default async function BrandsPage() {
  const [brands, settings, locale] = await Promise.all([
    getBrandsWithCounts(),
    getSiteSettings().catch(() => null),
    getLocale(),
  ]);

  const withProducts = brands.filter((brand) => (brand.count ?? 0) > 0);
  const totalProducts = withProducts.reduce((total, brand) => total + (brand.count ?? 0), 0);
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber =
    settings?.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    null;
  const businessName = settings?.businessName?.trim() || "Make My Home";

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs items={[{ label: translate(locale, "brands") }]} className="pt-2" />
          <div className="grid gap-8 pb-10 pt-5 sm:pb-14 sm:pt-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <p className="type-eyebrow">{translate(locale, "brandsKicker")}</p>
              <h1 className="type-h1 mt-3 max-w-[18ch] text-balance text-ink">
                {translate(locale, "brandsTitle")}
              </h1>
              <p className="type-lead mt-3 max-w-xl text-pretty">
                {translate(locale, "brandsIntro")}
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-line border-y border-line py-3">
              <div className="pr-3">
                <p className="font-display text-2xl leading-none text-ink">{withProducts.length}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                  {translate(locale, "homeStatsBrands")}
                </p>
              </div>
              <div className="pl-3">
                <p className="font-display text-2xl leading-none text-ink">{totalProducts}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                  {translate(locale, "homeStatsProducts")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container section-sm">
        {withProducts.length === 0 ? (
          <CatalogueNotice
            title={translate(locale, "setupEmptyTitle")}
            empty
            showBrandsLink={false}
          />
        ) : (
          <ul className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-4">
            {withProducts.map((brand) => {
              const logo = imageUrl(brand.logo, { width: 240, height: 160 });
              const count = brand.count ?? 0;
              return (
                <li key={brand._id} className="border-b border-r border-line">
                  <Link
                    href={`/brands/${encodeURIComponent(brand.slug)}`}
                    className="group flex h-full min-h-44 flex-col justify-between p-4 transition-colors hover:bg-sand/50 sm:p-5"
                  >
                    <div className="flex min-h-12 items-center">
                      {logo ? (
                        <Image
                          src={logo}
                          alt={brand.logo?.alt?.trim() || brand.name}
                          width={160}
                          height={64}
                          className="max-h-12 w-auto object-contain"
                        />
                      ) : (
                        <span className="font-display text-3xl font-medium tracking-tight text-ink-soft/70 transition-colors group-hover:text-forest">
                          {brandMonogram(brand.name)}
                        </span>
                      )}
                    </div>
                    <div className="mt-6">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-forest">
                          {brand.name}
                        </h2>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-forest"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                        {productCountLabel(count, locale)}
                      </p>
                      {brand.description ? (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                          {brand.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-line pt-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl text-ink">{translate(locale, "homeAskAnything")}</p>
            <p className="mt-1 max-w-xl text-sm text-ink-soft">{translate(locale, "homeAskAnythingBody")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ContactActions
              phone={phone}
              whatsappNumber={whatsappNumber}
              businessName={businessName}
              showMissing
              className="[&_a]:!min-h-11 [&_a]:!rounded-xs [&_a]:!px-4 [&_a]:!text-xs"
            />
            <Link href="/contact" className="btn btn-secondary btn-sm">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {translate(locale, "navContact")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
