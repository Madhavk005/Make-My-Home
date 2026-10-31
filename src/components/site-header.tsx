import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import { getSiteSettings, getTopLevelCategories } from "@/lib/catalogue";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { localizedSetting } from "@/lib/settings";
import { toNavNodes } from "@/lib/nav";
import { AccountControls } from "./account-controls";
import { EnquiryLink } from "./enquiry-link";
import { LanguageSwitch } from "./language-switch";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SearchBox } from "./search-box";
import { DesktopNav, MobileNav } from "./site-nav";

function BrandMark({
  name,
  logo,
  tagline,
  homeLabel,
}: {
  name: string;
  logo?: Parameters<typeof imageUrl>[0];
  tagline: string;
  homeLabel: string;
}) {
  const logoUrl = imageUrl(logo, { width: 190, height: 72 });

  return (
    <Link
      href="/"
      className="group flex min-h-12 min-w-0 items-center gap-2.5 sm:gap-3"
      aria-label={`${name} — ${homeLabel}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={190}
          height={72}
          className="h-11 w-auto max-w-36 object-contain"
          priority
        />
      ) : (
        <span
          aria-hidden="true"
          className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden bg-forest text-surface shadow-[inset_0_-3px_0_var(--color-brass)] sm:h-12 sm:w-12"
        >
          <span className="font-display text-xl leading-none sm:text-2xl">म</span>
          <span className="absolute inset-x-0 top-0 h-px bg-brass/70" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-[1.15rem] font-medium leading-none tracking-[-0.02em] text-ink sm:text-[1.35rem]">
          {name}
        </span>
        <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft sm:text-[11px]">
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

  const businessName = settings?.businessName?.trim() || "Make My Home";
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber =
    settings?.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    null;
  const nodes = toNavNodes(categories);
  const serviceArea = localizedSetting(settings, "serviceArea", locale);
  const announcement = localizedSetting(settings, "announcement", locale);

  return (
    <>
      <div className="no-print bg-forest text-surface">
        <div className="container flex min-h-9 items-center gap-3">
          <p className="line-clamp-2 min-w-0 flex-1 py-1.5 text-[10px] font-medium leading-snug tracking-wide text-surface/80 sm:line-clamp-1 sm:py-0 sm:text-xs">
            {announcement || translate(locale, "homeTrustBody")}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {serviceArea ? (
              <span className="hidden items-center gap-1.5 text-[11px] text-surface/70 xl:flex">
                <MapPin className="h-3 w-3 text-brass" aria-hidden="true" />
                {serviceArea}
              </span>
            ) : null}
            <LanguageSwitch tone="dark" />
            {phone ? (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="hidden min-h-8 items-center gap-1.5 text-[11px] font-semibold text-surface/90 transition-colors hover:text-brass sm:inline-flex"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <header className="no-print sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/90">
        <div className="container">
          <div className="flex min-h-[72px] items-center gap-3 py-2.5 sm:gap-5">
            <BrandMark
              name={businessName}
              logo={settings?.logo}
              tagline={translate(locale, "brandTagline")}
              homeLabel={translate(locale, "home")}
            />

            <div className="hidden min-w-0 flex-1 md:block lg:max-w-xl lg:mx-auto">
              <SearchBox variant="header" />
            </div>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <span className="hidden sm:block">
                <EnquiryLink />
              </span>
              <AccountControls />
              <MobileNav
                nodes={nodes}
                phone={phone}
                whatsappNumber={whatsappNumber}
                businessName={businessName}
              />
            </div>
          </div>

          <div className="pb-2.5 md:hidden">
            <SearchBox variant="header" />
          </div>
        </div>

        <div className="hidden border-t border-line/80 lg:block">
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
