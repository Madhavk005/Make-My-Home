import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getSiteSettings } from "@/lib/catalogue";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getSettingWhatsAppNumber, localizedSetting } from "@/lib/settings";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EnquiryList } from "@/components/enquiry-list";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "enquiryList"),
    description: translate(locale, "enquiryIntro"),
    robots: { index: false, follow: true },
  };
}

export default async function EnquiryPage() {
  const [settings, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getLocale(),
  ]);
  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const phone = settings?.phone?.trim() || null;
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const priceNote = localizedSetting(settings, "priceNote", locale);

  return (
    <div>
      <section className="border-b border-line bg-sand/40">
        <div className="container">
          <Breadcrumbs items={[{ label: translate(locale, "enquiryList") }]} className="pt-2" />
          <div className="grid gap-6 pb-9 pt-5 sm:pb-12 sm:pt-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="type-eyebrow">{translate(locale, "enquiryKicker")}</p>
              <h1 className="type-h1 mt-3 max-w-[20ch] text-balance text-ink">
                {translate(locale, "enquiryPageTitle")}
              </h1>
              <p className="type-lead mt-3 max-w-xl text-pretty">
                {translate(locale, "enquiryIntro")}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                <ShieldCheck className="h-4 w-4 text-whatsapp" aria-hidden="true" />
                {translate(locale, "enquiryTrust")}
              </p>
            </div>
            <Link href="/search" className="link-quiet">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {translate(locale, "addMoreProducts")}
            </Link>
          </div>
        </div>
      </section>

      <div className="container section-sm">
        <div className="hidden print:mb-6 print:block">
          <p className="text-lg font-semibold text-ink">{businessName}</p>
          <p className="text-sm text-ink-soft">
            {new Date().toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
              dateStyle: "long",
            })}
          </p>
        </div>

        <EnquiryList
          whatsappNumber={whatsappNumber}
          phone={phone}
          businessName={settings?.businessName ?? null}
          priceNote={priceNote}
        />

        <p className="mt-8 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-soft">
          {translate(locale, "enquiryStepNote")}
        </p>
      </div>
    </div>
  );
}
