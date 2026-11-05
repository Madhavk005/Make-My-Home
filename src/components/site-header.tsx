import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import { getSiteSettings, getTopLevelCategories } from "@/lib/catalogue";
import { categoryHref } from "@/lib/categories";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { getSettingWhatsAppNumber } from "@/lib/settings";
import { toNavNodes } from "@/lib/nav";
import { AccountControls } from "./account-controls";
import { CompareLink } from "./compare-link";
import { EnquiryLink } from "./enquiry-link";
import { LanguageSwitch } from "./language-switch";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileNav } from "./site-nav";

function BrandMark({
  name,
  logo,
  tagline,
}: {
  name: string;
  logo?: Parameters<typeof imageUrl>[0];
  tagline: string;
}) {
  const logoUrl = imageUrl(logo, { width: 190, height: 72 });

  return (
    <Link href="/" className="group flex min-h-11 min-w-0 items-center gap-2.5 sm:gap-3">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={190}
          height={72}
          className="h-10 w-auto max-w-32 object-contain"
          priority
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-forest text-surface shadow-[inset_0_-3px_0_var(--color-brass)] sm:h-11 sm:w-11"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" stroke="var(--color-brass)" />
          </svg>
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-[1.05rem] font-medium leading-none tracking-[-0.02em] text-ink sm:text-[1.25rem]">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft sm:text-[10px]">
          {tagline}
        </span>
      </span>
    </Link>
  );
}

function findCategoryHref(categories: Array<{ slug?: string; name?: string; path?: string[] }>, keywords: string[]): string {
  const match = categories.find((category) => {
    const text = `${category.slug ?? ""} ${category.name ?? ""}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });
  return match ? categoryHref(match.path ?? []) : "/categories";
}

export async function SiteHeader() {
  const [settings, categories, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getTopLevelCategories().catch(() => []),
    getLocale(),
  ]);

  const hi = locale === "hi";
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const filteredCategories = categories.filter((category) => {
    const slug = category.slug?.toLowerCase() ?? "";
    const name = category.name?.toLowerCase() ?? "";
    return slug !== "material" && name !== "material" && name !== "सामग्री";
  });
  const nodes = toNavNodes(filteredCategories);
  const navItems = [
    { label: hi ? "होम" : "Home", href: "/" },
    { label: hi ? "सभी श्रेणियाँ" : "All Categories", href: "/categories" },
    { label: hi ? "निर्माण" : "Construction", href: findCategoryHref(filteredCategories, ["construction", "cement", "structure", "निर्माण"]) },
    { label: hi ? "इलेक्ट्रिकल" : "Electrical", href: findCategoryHref(filteredCategories, ["electrical", "तार", "electric"]) },
    { label: hi ? "प्लंबिंग" : "Plumbing", href: findCategoryHref(filteredCategories, ["plumbing", "पाइप", "pipe"]) },
    { label: hi ? "फ्लोरिंग" : "Flooring", href: findCategoryHref(filteredCategories, ["flooring", "tile", "टाइल", "floor"]) },
    { label: hi ? "सैनीटरीवेयर" : "Sanitaryware", href: findCategoryHref(filteredCategories, ["sanitary", "सैनीटरी"]) },
    { label: hi ? "हार्डवेयर" : "Hardware", href: findCategoryHref(filteredCategories, ["hardware", "हार्डवेयर"]) },
    { label: hi ? "कारीगर बुलाएँ" : "Hire a Professional", href: "/#hire-professional" },
    { label: hi ? "संपर्क" : "Contact Us", href: "/contact" },
  ];

  const mobileLinks = [
    { label: hi ? "होम" : "Home", href: "/" },
    { label: hi ? "सभी श्रेणियाँ" : "All Categories", href: "/categories" },
    { label: hi ? "निर्माण" : "Construction", href: findCategoryHref(filteredCategories, ["construction", "cement", "structure", "निर्माण"]) },
    { label: hi ? "इलेक्ट्रिकल" : "Electrical", href: findCategoryHref(filteredCategories, ["electrical", "तार", "electric"]) },
    { label: hi ? "प्लंबिंग" : "Plumbing", href: findCategoryHref(filteredCategories, ["plumbing", "पाइप", "pipe"]) },
    { label: hi ? "फ्लोरिंग" : "Flooring", href: findCategoryHref(filteredCategories, ["flooring", "tile", "टाइल", "floor"]) },
    { label: hi ? "सैनीटरीवेयर" : "Sanitaryware", href: findCategoryHref(filteredCategories, ["sanitary", "सैनीटरी"]) },
    { label: hi ? "हार्डवेयर" : "Hardware", href: findCategoryHref(filteredCategories, ["hardware", "हार्डवेयर"]) },
    { label: hi ? "लाइटिंग" : "Lighting", href: findCategoryHref(filteredCategories, ["lighting", "लाइटिंग"]) },
    { label: hi ? "इलेक्ट्रॉनिक्स" : "Electronics", href: findCategoryHref(filteredCategories, ["electronics", "इलेक्ट्रॉनिक्स"]) },
    { label: hi ? "कारीगर बुलाएँ" : "Hire a Professional", href: "/#hire-professional" },
    { label: hi ? "हमारे बारे में" : "About Us", href: "/about" },
    { label: hi ? "संपर्क" : "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b-2 border-brass bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
        {/* Main row */}
        <div className="border-b border-line/70">
          <div className="container flex min-h-12 items-center gap-3 py-1.5 sm:gap-4">
            <BrandMark name={businessName} logo={settings?.logo} tagline={translate(locale, "brandTagline")} />

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 lg:flex">
                <LanguageSwitch />
                {phone ? (
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-forest"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {phone}
                  </a>
                ) : null}
              </div>
              <CompareLink />
              <EnquiryLink />
              <AccountControls />
              <MobileNav
                nodes={nodes}
                phone={phone}
                whatsappNumber={whatsappNumber}
                businessName={businessName}
                quickLinks={mobileLinks}
              />
            </div>
          </div>
        </div>

        {/* Navigation row */}
        <div className="hidden bg-canvas md:block">
          <div className="container">
            <nav className="flex items-center gap-1 overflow-x-auto py-1.5" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="nav-link whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <MobileBottomNav />
    </>
  );
}
