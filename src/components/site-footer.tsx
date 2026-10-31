import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings, getTopLevelCategories } from "@/lib/catalogue";
import { categoryHref } from "@/lib/categories";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { localizedSetting } from "@/lib/settings";
import { ContactActions } from "./contact-actions";

export async function SiteFooter() {
  const [settings, categories, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getTopLevelCategories().catch(() => []),
    getLocale(),
  ]);

  const businessName = settings?.businessName?.trim() || "Make My Home";
  const year = new Date().getFullYear();
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber =
    settings?.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    null;
  const footerNote =
    localizedSetting(settings, "footerNote", locale) ||
    localizedSetting(settings, "tagline", locale);
  const serviceArea = localizedSetting(settings, "serviceArea", locale);
  const address = localizedSetting(settings, "address", locale);
  const openingHours = localizedSetting(settings, "openingHours", locale);
  const priceNote = localizedSetting(settings, "priceNote", locale);

  return (
    <footer className="no-print mt-auto bg-forest-deep text-surface">
      <div className="container">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr] lg:gap-12 lg:py-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label={businessName}>
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center bg-surface font-display text-xl leading-none text-forest shadow-[inset_0_-3px_0_var(--color-brass)]"
              >
                म
              </span>
              <span className="font-display text-2xl font-medium tracking-[-0.02em]">
                {businessName}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface/65">
              {footerNote || translate(locale, "homeTrustBody")}
            </p>
            <div className="mt-5">
              <ContactActions
                phone={phone}
                whatsappNumber={whatsappNumber}
                businessName={businessName}
                className="[&_a]:!min-h-11 [&_a]:!rounded-xs [&_a]:!px-4 [&_a]:!text-xs"
              />
            </div>
            {serviceArea ? (
              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-surface/55">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass" aria-hidden="true" />
                {translate(locale, "footerServing", { area: serviceArea })}
              </p>
            ) : null}
          </div>

          <nav aria-label={translate(locale, "footerCatalogue")}>
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
              {translate(locale, "footerCatalogue")}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link href="/categories" className="flex min-h-10 items-center text-sm text-surface/70 transition-colors hover:text-surface">
                  {translate(locale, "footerAllCategories")}
                </Link>
              </li>
              {categories.slice(0, 5).map((category) => (
                <li key={category._id}>
                  <Link
                    href={categoryHref(category.path)}
                    className="flex min-h-10 items-center text-sm text-surface/70 transition-colors hover:text-surface"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/search" className="flex min-h-10 items-center text-sm text-surface/70 transition-colors hover:text-surface">
                  {translate(locale, "allProducts")}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={translate(locale, "footerQuickLinks")}>
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
              {translate(locale, "footerQuickLinks")}
            </h2>
            <ul className="mt-4 space-y-1">
              {[
                { href: "/brands", label: translate(locale, "brands") },
                { href: "/enquiry", label: translate(locale, "enquiryList") },
                { href: "/about", label: translate(locale, "footerAboutUs") },
                { href: "/contact", label: translate(locale, "footerContactUs") },
                { href: "/studio", label: "Studio" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-10 items-center gap-1.5 text-sm text-surface/70 transition-colors hover:text-surface"
                  >
                    {item.label}
                    <ArrowUpRight className="h-3 w-3 text-surface/30" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
              {translate(locale, "footerContact")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-surface/70">
              {phone ? (
                <li>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex min-h-10 items-center gap-2 transition-colors hover:text-surface"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                    {phone}
                  </a>
                </li>
              ) : null}
              {settings?.email ? (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex min-h-10 items-center gap-2 break-all transition-colors hover:text-surface"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                    {settings.email}
                  </a>
                </li>
              ) : null}
              {address ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                  <span className="whitespace-pre-line leading-relaxed">{address}</span>
                </li>
              ) : null}
              {openingHours ? (
                <li className="flex items-start gap-2">
                  <Clock className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                  <span className="leading-relaxed">{openingHours}</span>
                </li>
              ) : null}
              {!phone && !settings?.email && !address ? (
                <li className="text-surface/50">{translate(locale, "footerNoContact")}</li>
              ) : null}
            </ul>

            <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.1em] text-surface/50">
              {settings?.instagram ? (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-surface">
                  Instagram
                </a>
              ) : null}
              {settings?.facebook ? (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-surface">
                  Facebook
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-surface/12 py-6 text-[11px] text-surface/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{translate(locale, "footerRights", { year, business: businessName })}</p>
          <p className="max-w-xl sm:text-right">
            {priceNote || translate(locale, "footerIndicative")}
          </p>
        </div>
      </div>
    </footer>
  );
}
