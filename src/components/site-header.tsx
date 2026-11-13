import Link from "next/link";
import Image from "next/image";
import { Phone, Truck, ShieldCheck } from "lucide-react";
import { getSiteSettings, getTopLevelCategories } from "@/lib/catalogue";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { getSettingWhatsAppNumber, localizedSetting } from "@/lib/settings";
import { toNavNodes } from "@/lib/nav";
import { AccountControls } from "./account-controls";
import { CompareLink } from "./compare-link";
import { DesktopNav, MobileNav } from "./site-nav";
import { EnquiryLink } from "./enquiry-link";
import { LanguageSwitch } from "./language-switch";
import { LocationPill } from "./location-pill";
import { MobileBottomNav } from "./mobile-bottom-nav";

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
          className="h-9 w-auto max-w-32 object-contain sm:h-10"
          priority
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-white sm:h-11 sm:w-11"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="#D92332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M9 21v-6h6v6" stroke="#F5A623" />
          </svg>
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[1.05rem] font-extrabold leading-none tracking-[-0.01em] text-white sm:text-[1.3rem]">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 sm:text-[11px]">
          {tagline}
        </span>
      </span>
    </Link>
  );
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
  const serviceArea = localizedSetting(settings, "serviceArea", locale) || null;
  const nodes = toNavNodes(categories);
  const quickLinks = [
    { label: hi ? "कारीगर बुलाएँ" : "Hire a Professional", href: "/#hire-professional" },
    { label: hi ? "कैलकुलेटर" : "Calculator", href: "/calculator" },
    { label: hi ? "डिलीवरी" : "Delivery", href: "/delivery" },
    { label: hi ? "कोटेशन" : "Quotation", href: "/quote" },
    { label: hi ? "हमारे बारे में" : "About Us", href: "/about" },
    { label: hi ? "संपर्क" : "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <header className="no-print on-dark sticky top-0 z-40 bg-primary text-white shadow-[0_2px_12px_-4px_rgb(32_36_44_/_0.45)]">
        {/* Utility strip — trust signals and phone */}
        <div className="hidden border-b border-white/10 bg-charcoal sm:block">
          <div className="container flex min-h-8 items-center justify-between gap-4 py-1 text-[11px] font-medium text-white/85">
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {hi ? "सत्यापित दुकानदार" : "Verified suppliers"}
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Truck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {hi ? "साइट पर डिलीवरी" : "Site delivery available"}
              </span>
              <span className="hidden whitespace-nowrap text-white/60 lg:inline">
                {hi ? "सीधे दुकान से · UPI भुगतान उपलब्ध" : "Direct from the shop · UPI payment available"}
              </span>
            </div>
            {phone ? (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap font-bold text-white transition-colors hover:text-accent"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {phone}
              </a>
            ) : null}
          </div>
        </div>

        {/* Main blue row */}
        <div className="border-b border-white/15">
          <div className="container flex min-h-14 items-center gap-2 py-1.5 sm:gap-4">
            <BrandMark name={businessName} logo={settings?.logo} tagline={translate(locale, "brandTagline")} />

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
              <LocationPill serviceArea={serviceArea} hi={hi} />
              <div className="hidden items-center gap-2 sm:flex">
                <LanguageSwitch tone="dark" />
              </div>
              <CompareLink />
              <EnquiryLink />
              <AccountControls />
              <MobileNav
                nodes={nodes}
                phone={phone}
                whatsappNumber={whatsappNumber}
                businessName={businessName}
                quickLinks={quickLinks}
              />
            </div>
          </div>
        </div>

        {/* Category navigation row */}
        <div className="hidden bg-primary md:block">
          <div className="container">
            <DesktopNav
              nodes={nodes}
              phone={phone}
              whatsappNumber={whatsappNumber}
              businessName={businessName}
            />
          </div>
        </div>
      </header>

      <MobileBottomNav />
    </>
  );
}
