import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { getSiteSettings } from "@/lib/catalogue";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getSettingWhatsAppNumber, localizedSetting } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactActions } from "@/components/contact-actions";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "contactKicker"),
    description: translate(locale, "contactIntro"),
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const [settings, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getLocale(),
  ]);

  const businessName = settings?.businessName?.trim() || "Make My Home";
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    translate(locale, "whatsappMessageGeneric", { business: businessName }),
  );
  const address = localizedSetting(settings, "address", locale);
  const openingHours = localizedSetting(settings, "openingHours", locale);
  const serviceArea = localizedSetting(settings, "serviceArea", locale);
  const directionsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  const askItems = [
    translate(locale, "contactAskItem1"),
    translate(locale, "contactAskItem2"),
    translate(locale, "contactAskItem3"),
  ];

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: translate(locale, "home"), href: "/" },
              { label: translate(locale, "navContact") },
            ]}
            className="pt-2"
          />
          <div className="grid gap-8 pb-10 pt-5 sm:pb-14 sm:pt-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
            <div>
              <p className="type-eyebrow">{translate(locale, "contactKicker")}</p>
              <h1 className="type-h1 mt-3 max-w-[18ch] text-balance text-ink">
                {translate(locale, "contactTitle")}
              </h1>
              <p className="type-lead mt-4 max-w-xl text-pretty">
                {translate(locale, "contactIntro")}
              </p>
              <div className="mt-6">
                <ContactActions
                  phone={phone}
                  whatsappNumber={whatsappNumber}
                  businessName={businessName}
                  showMissing
                  className="[&_a]:!min-h-12 [&_a]:!rounded-xs [&_a]:!px-5 [&_a]:!text-sm"
                />
              </div>
            </div>
            <div className="border border-line bg-surface p-5 sm:p-6">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-deep">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                {translate(locale, "contactAskTitle")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {translate(locale, "contactAskBody")}
              </p>
              <ol className="mt-4 space-y-2.5">
                {askItems.map((item, index) => (
                  <li key={item} className="flex items-start gap-3 border-t border-line pt-2.5 text-sm text-ink">
                    <span className="font-mono text-[10px] text-primary-deep">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-line bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center border border-line bg-sand text-whatsapp">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-xl font-medium tracking-tight text-ink">
                {translate(locale, "contactWhatsappTitle")}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {translate(locale, "contactWhatsappBody")}
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow mt-4"
                >
                  {translate(locale, "whatsappAsk")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-3 text-xs text-ink-faint">{translate(locale, "noContactYet")}</p>
              )}
            </div>

            <div className="border border-line bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center border border-line bg-sand text-primary-deep">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-xl font-medium tracking-tight text-ink">
                {translate(locale, "contactCallTitle")}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {translate(locale, "contactCallBody")}
              </p>
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="link-arrow mt-4"
                >
                  {phone}
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-3 text-xs text-ink-faint">{translate(locale, "noContactYet")}</p>
              )}
            </div>

            <div className="border border-line bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center border border-line bg-sand text-primary-deep">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-display text-xl font-medium tracking-tight text-ink">
                {translate(locale, "contactVisitTitle")}
              </h2>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {address || translate(locale, "footerNoContact")}
              </p>
              {directionsUrl ? (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-arrow mt-4"
                >
                  {translate(locale, "contactDirections")}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-10 grid gap-8 border-t border-line pt-8 lg:grid-cols-[1fr_0.9fr] lg:gap-14">
            <div>
              <p className="type-eyebrow">{translate(locale, "storeContact")}</p>
              <h2 className="type-h2 mt-3 max-w-[16ch] text-balance text-ink">
                {translate(locale, "aboutVisitTitle")}
              </h2>
              <dl className="mt-6 max-w-xl divide-y divide-line border-y border-line text-sm">
                <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                  <dt className="flex items-center gap-2 text-ink-soft">
                    <MapPin className="h-3.5 w-3.5 text-primary-deep" aria-hidden="true" />
                    {translate(locale, "footerVisit")}
                  </dt>
                  <dd className="whitespace-pre-line leading-relaxed text-ink">
                    {address || translate(locale, "footerNoContact")}
                  </dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                  <dt className="flex items-center gap-2 text-ink-soft">
                    <Clock className="h-3.5 w-3.5 text-primary-deep" aria-hidden="true" />
                    {translate(locale, "contactHoursTitle")}
                  </dt>
                  <dd className="leading-relaxed text-ink">
                    {openingHours || translate(locale, "noContactYet")}
                  </dd>
                </div>
                {serviceArea ? (
                  <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                    <dt className="flex items-center gap-2 text-ink-soft">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary-deep" aria-hidden="true" />
                      {translate(locale, "homeServiceAreaLabel")}
                    </dt>
                    <dd className="leading-relaxed text-ink">{serviceArea}</dd>
                  </div>
                ) : null}
                {settings?.email ? (
                  <div className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                    <dt className="flex items-center gap-2 text-ink-soft">
                      <Mail className="h-3.5 w-3.5 text-primary-deep" aria-hidden="true" />
                      {translate(locale, "contactEmail")}
                    </dt>
                    <dd className="break-all">
                      <a
                        href={`mailto:${settings.email}`}
                        className="text-ink underline-offset-2 hover:text-primary-deep hover:underline"
                      >
                        {settings.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="border border-line bg-charcoal p-6 text-surface sm:p-8">
              <p className="type-eyebrow text-surface">{translate(locale, "enquiryKicker")}</p>
              <h2 className="mt-3 font-display text-2xl font-medium tracking-tight">
                {translate(locale, "homeCtaTitle")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-surface/75">
                {translate(locale, "homeCtaBody")}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/enquiry" className="btn btn-light w-full">
                  {translate(locale, "openEnquiryList")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/categories"
                  className="btn btn-secondary w-full !border-surface/25 !text-surface hover:!bg-surface/10"
                >
                  {translate(locale, "browseCatalogue")}
                </Link>
              </div>
              <p className="mt-4 border-t border-surface/15 pt-3 text-[11px] leading-relaxed text-surface/55">
                {translate(locale, "enquiryTrust")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
