import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/catalogue";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { localizedSetting } from "@/lib/settings";
import { ConnectionBanner } from "@/components/connection-banner";
import { LocaleProvider } from "@/components/locale-provider";
import { BackToTop } from "@/components/back-to-top";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getLocale(),
  ]);
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const isHindi = locale === "hi";

  return {
    title: {
      default: isHindi ? "निर्माण सामग्री कैटलॉग" : "Building materials catalogue",
      template: `%s · ${businessName}`,
    },
    description:
      localizedSetting(settings, "tagline", locale) ||
      (isHindi
        ? "घर बनाने का सामान देखें और कीमत, उपलब्धता व डिलीवरी के लिए दुकानदार से WhatsApp पर पूछें।"
        : "Browse building materials, fittings and home products, then enquire on WhatsApp to confirm the current rate, availability and delivery."),
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <LocaleProvider initialLocale={locale}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-paper"
      >
        {translate(locale, "skipToContent")}
      </a>
      <SiteHeader />
      <ConnectionBanner />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <BackToTop />
    </LocaleProvider>
  );
}
