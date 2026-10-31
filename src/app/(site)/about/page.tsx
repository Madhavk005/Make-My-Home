import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getBrandsWithCounts, getCatalogue, getSiteSettings } from "@/lib/catalogue";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { localizedSetting } from "@/lib/settings";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactActions } from "@/components/contact-actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "aboutKicker"),
    description: translate(locale, "aboutIntro"),
    alternates: { canonical: "/about" },
  };
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: "valueHonestTitle",
    body: "valueHonestBody",
  },
  {
    icon: MapPin,
    title: "valueLocalTitle",
    body: "valueLocalBody",
  },
  {
    icon: Users,
    title: "valueSimpleTitle",
    body: "valueSimpleBody",
  },
] as const;

export default async function AboutPage() {
  const [settings, catalogue, brands, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCatalogue(),
    getBrandsWithCounts().catch(() => []),
    getLocale(),
  ]);

  const businessName = settings?.businessName?.trim() || "Make My Home";
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber =
    settings?.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    null;
  const brandCount = brands.filter((brand) => (brand.count ?? 0) > 0).length;
  const address = localizedSetting(settings, "address", locale);
  const openingHours = localizedSetting(settings, "openingHours", locale);

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: translate(locale, "home"), href: "/" },
              { label: translate(locale, "footerAboutUs") },
            ]}
            className="pt-2"
          />
          <div className="grid gap-8 pb-10 pt-5 sm:pb-14 sm:pt-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
            <div>
              <p className="type-eyebrow">{translate(locale, "aboutKicker")}</p>
              <h1 className="type-h1 mt-3 max-w-[18ch] text-balance text-ink">
                {translate(locale, "aboutTitle")}
              </h1>
              <p className="type-lead mt-4 max-w-xl text-pretty">
                {translate(locale, "aboutIntro")}
              </p>
            </div>
            <div className="relative min-h-[16rem] overflow-hidden border border-line bg-sand sm:min-h-[20rem]">
              <Image
                src="/images/about-build.jpg"
                alt="Layered construction materials in warm daylight"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/55 to-transparent" />
              <p className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.16em] text-surface/85">
                {businessName} / Material House
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="type-eyebrow">{translate(locale, "aboutStoryTitle")}</p>
            <h2 className="type-h2 mt-3 max-w-[14ch] text-balance text-ink">
              {translate(locale, "homeEditorialTitle")}
            </h2>
          </div>
          <div className="space-y-4 text-pretty text-base leading-relaxed text-ink-soft">
            <p>{translate(locale, "aboutStoryBody1")}</p>
            <p>{translate(locale, "aboutStoryBody2")}</p>
          </div>
        </div>
      </section>

      <section className="section-sm border-y border-line bg-surface/70">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="border-l-2 border-clay pl-4">
              <p className="font-display text-4xl leading-none text-ink">
                {catalogue.totalProducts.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                {translate(locale, "homeStatsProducts")}
              </p>
            </div>
            <div className="border-l-2 border-brass pl-4">
              <p className="font-display text-4xl leading-none text-ink">
                {catalogue.tree.length.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                {translate(locale, "homeStatsCategories")}
              </p>
            </div>
            <div className="border-l-2 border-forest pl-4">
              <p className="font-display text-4xl leading-none text-ink">
                {brandCount.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                {translate(locale, "homeStatsBrands")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="max-w-2xl">
            <p className="type-eyebrow">{translate(locale, "aboutValuesTitle")}</p>
            <h2 className="type-h2 mt-3 text-balance text-ink">
              {translate(locale, "aboutValuesHeading")}
            </h2>
          </div>
          <ol className="mt-9 grid gap-8 md:grid-cols-3">
            {VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <li key={value.title} className="border-t border-ink/20 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-clay">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="h-5 w-5 text-ink-soft" aria-hidden="true" />
                  </div>
                  <h3 className="mt-7 font-display text-xl font-medium tracking-tight text-ink">
                    {translate(locale, value.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {translate(locale, value.body)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="section-sm border-t border-line">
        <div className="container">
          <div className="grid overflow-hidden border border-forest-deep/15 bg-forest text-surface lg:grid-cols-[1fr_0.9fr]">
            <div className="relative min-h-[18rem] lg:min-h-[26rem]">
              <Image
                src="/images/interior-finish.jpg"
                alt="Finished interior with warm neutral surfaces"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/60 to-transparent" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-10">
              <p className="type-eyebrow text-brass">{translate(locale, "aboutVisitTitle")}</p>
              <h2 className="type-h2 mt-3 text-balance text-surface">
                {translate(locale, "contactTitle")}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-surface/75">
                {translate(locale, "contactIntro")}
              </p>

              <div className="mt-6 space-y-3 border-t border-surface/15 pt-5 text-sm text-surface/80">
                {address ? (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                    <span className="whitespace-pre-line leading-relaxed">{address}</span>
                  </p>
                ) : null}
                {openingHours ? (
                  <p className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                    <span>{openingHours}</span>
                  </p>
                ) : null}
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex min-h-10 items-center gap-2.5 font-semibold text-surface transition-colors hover:text-brass"
                  >
                    <Phone className="h-4 w-4 text-brass" aria-hidden="true" />
                    {phone}
                  </a>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <ContactActions
                  phone={phone}
                  whatsappNumber={whatsappNumber}
                  businessName={businessName}
                  showMissing
                  className="[&_a]:!min-h-11 [&_a]:!rounded-xs [&_a]:!px-4 [&_a]:!text-xs"
                />
                <Link
                  href="/contact"
                  className="btn btn-secondary !min-h-11 !rounded-xs !border-surface/25 !px-4 !text-xs !text-surface hover:!bg-surface/10"
                >
                  {translate(locale, "navContact")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container pb-10">
        <p className="flex items-center justify-center gap-2 border-t border-line pt-5 text-center text-[11px] text-ink-faint">
          <Sparkles className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
          {translate(locale, "footerBuiltNote")}
        </p>
      </div>
    </div>
  );
}
