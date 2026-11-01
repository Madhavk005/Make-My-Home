import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSiteSettings, getTopLevelCategories } from "@/lib/catalogue";
import { categoryHref } from "@/lib/categories";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { localizedSetting } from "@/lib/settings";
import { LanguageSwitch } from "./language-switch";
import { ContactActions } from "./contact-actions";

export async function SiteFooter() {
  const [settings, categories, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getTopLevelCategories().catch(() => []),
    getLocale(),
  ]);

  const hi = locale === "hi";
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

  const filteredCategories = categories.filter((category) => {
    const slug = category.slug?.toLowerCase() ?? "";
    const name = category.name?.toLowerCase() ?? "";
    return slug !== "material" && name !== "material" && name !== "सामग्री";
  });

  const serviceLinks = [
    { label: hi ? "राज मिस्त्री बुलाएँ" : "Hire a Mason", href: "/#hire-professional" },
    { label: hi ? "इलेक्ट्रिशियन बुलाएँ" : "Hire an Electrician", href: "/#hire-professional" },
    { label: hi ? "प्लंबर बुलाएँ" : "Hire a Plumber", href: "/#hire-professional" },
    { label: hi ? "पेंटर बुलाएँ" : "Hire a Painter", href: "/#hire-professional" },
    { label: hi ? "कारपेंटर बुलाएँ" : "Hire a Carpenter", href: "/#hire-professional" },
    { label: hi ? "टाइल फिटर बुलाएँ" : "Hire a Tile Fitter", href: "/#hire-professional" },
    { label: hi ? "निर्माण मज़दूर बुलाएँ" : "Hire Construction Labour", href: "/#hire-professional" },
    { label: hi ? "ठेकेदार बुलाएँ" : "Hire a Contractor", href: "/#hire-professional" },
  ];

  const supportLinks = [
    { label: hi ? "कस्टमर केयर" : "Customer Care", href: "/#customer-care" },
    ...(phone ? [{ label: hi ? "कॉल करें" : "Call Us", href: `tel:${phone.replace(/[^\d+]/g, "")}` }] : []),
    ...(whatsappNumber
      ? [{ label: hi ? "WhatsApp करें" : "WhatsApp Us", href: `https://wa.me/${whatsappNumber.replace(/\D/g, "")}` }]
      : []),
    { label: hi ? "प्रोडक्ट पूछताछ" : "Product Enquiry", href: "/enquiry" },
    { label: hi ? "संपर्क" : "Contact Us", href: "/contact" },
  ];

  const companyLinks = [
    { label: hi ? "हमारे बारे में" : "About Us", href: "/about" },
    { label: hi ? "संपर्क" : "Contact Us", href: "/contact" },
    { label: hi ? "सामान सूची" : "Enquiry List", href: "/enquiry" },
  ];

  return (
    <footer className="no-print mt-auto bg-forest-deep text-surface">
      {/* Customer care CTA */}
      <div className="border-b border-surface/10 bg-forest">
        <div className="container flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-surface sm:text-xl">
              {hi ? "सही सामग्री चुनने में मदद चाहिए?" : "Need help finding the right material?"}
            </h2>
            <p className="mt-1 text-sm text-surface/80">
              {hi ? "हमारी टीम से सीधे बात करें।" : "Talk directly with our team."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {phone ? (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-forest transition-colors hover:bg-canvas"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {hi ? "कस्टमर केयर कॉल करें" : "Call Customer Care"}
              </a>
            ) : null}
            {whatsappNumber ? (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                  hi ? `नमस्ते ${businessName}, मुझे सामग्री चुनने में मदद चाहिए।` : `Hello ${businessName}, I need help choosing materials.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-black transition-colors hover:bg-success/90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {hi ? "WhatsApp पूछताछ" : "WhatsApp Enquiry"}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-10 lg:py-14">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3" aria-label={businessName}>
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-md bg-surface text-forest shadow-[inset_0_-3px_0_var(--color-brass)]"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V21h14V9.5" />
                  <path d="M9 21v-6h6v6" stroke="var(--color-brass)" />
                </svg>
              </span>
              <span className="font-display text-2xl font-medium tracking-[-0.02em] text-surface">
                {businessName}
              </span>
            </Link>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brass">
              Build Better. Live Better.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface/70">
              {footerNote ||
                (hi
                  ? "निर्माण सामग्री, घर बनाने के उत्पाद और पेशेवर सेवाओं के लिए आपका भरोसेमंद ठिकाना।"
                  : "Your trusted destination for construction materials, home-building products and professional services.")}
            </p>

            <div className="mt-5">
              <ContactActions
                phone={phone}
                whatsappNumber={whatsappNumber}
                businessName={businessName}
                className="[&_a]:!min-h-10 [&_a]:!rounded-md [&_a]:!px-4 [&_a]:!text-xs"
              />
            </div>

            {settings?.instagram || settings?.facebook ? (
              <div className="mt-5 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.1em] text-surface/60">
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
            ) : null}

            <div className="mt-6">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brass">
                {hi ? "भाषा" : "Language"}
              </p>
              <LanguageSwitch tone="dark" />
            </div>
          </div>

          {/* Shop by category */}
          <details className="group sm:open" open>
            <summary className="flex cursor-pointer list-none items-center justify-between border-b border-surface/10 pb-3 text-sm font-bold uppercase tracking-[0.12em] text-brass sm:cursor-default sm:border-0 sm:pb-0 [&::-webkit-details-marker]:hidden">
              {hi ? "श्रेणी से खरीदें" : "Shop by category"}
              <span className="text-surface/60 transition-transform group-open:rotate-180 sm:hidden">▾</span>
            </summary>
            <ul className="mt-4 space-y-2">
              {filteredCategories.map((category) => (
                <li key={category._id}>
                  <Link
                    href={categoryHref(category.path)}
                    className="flex min-h-9 items-center text-sm text-surface/70 transition-colors hover:text-surface"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          {/* Professional services */}
          <details className="group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between border-b border-surface/10 pb-3 text-sm font-bold uppercase tracking-[0.12em] text-brass sm:cursor-default sm:border-0 sm:pb-0 [&::-webkit-details-marker]:hidden">
              {hi ? "पेशेवर सेवाएँ" : "Professional services"}
              <span className="text-surface/60 transition-transform group-open:rotate-180 sm:hidden">▾</span>
            </summary>
            <ul className="mt-4 space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex min-h-9 items-center text-sm text-surface/70 transition-colors hover:text-surface"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          {/* Support and company */}
          <details className="group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between border-b border-surface/10 pb-3 text-sm font-bold uppercase tracking-[0.12em] text-brass sm:cursor-default sm:border-0 sm:pb-0 [&::-webkit-details-marker]:hidden">
              {hi ? "सहायता और कंपनी" : "Support and company"}
              <span className="text-surface/60 transition-transform group-open:rotate-180 sm:hidden">▾</span>
            </summary>
            <ul className="mt-4 space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex min-h-9 items-center text-sm text-surface/70 transition-colors hover:text-surface"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex min-h-9 items-center text-sm text-surface/70 transition-colors hover:text-surface"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {/* Verified contact details */}
        {(phone || settings?.email || address || openingHours || serviceArea) ? (
          <div className="border-t border-surface/10 py-6">
            <div className="grid gap-3 text-sm text-surface/70 sm:grid-cols-2 lg:grid-cols-4">
              {phone ? (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex min-h-9 items-center gap-2 transition-colors hover:text-surface">
                  <Phone className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                  {phone}
                </a>
              ) : null}
              {settings?.email ? (
                <a href={`mailto:${settings.email}`} className="flex min-h-9 items-center gap-2 break-all transition-colors hover:text-surface">
                  <Mail className="h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                  {settings.email}
                </a>
              ) : null}
              {openingHours ? (
                <div className="flex items-start gap-2">
                  <Clock className="mt-1 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                  <span className="leading-relaxed">{openingHours}</span>
                </div>
              ) : null}
              {serviceArea ? (
                <p className="sm:col-span-2 lg:col-span-4">
                  {hi ? "सेवा क्षेत्र: " : "Service area: "}{serviceArea}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom strip */}
      <div className="border-t border-surface/10">
        <div className="container flex flex-col gap-2 py-5 text-[11px] text-surface/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {businessName}. {hi ? "जानकारी बदल सकती है।" : "Information may change."}</p>
          <p className="max-w-xl sm:text-right">
            {hi ? "दिखाई गई कीमतें सिर्फ़ अनुमान हैं। पक्की कीमत, स्टॉक और डिलीवरी दुकानदार से पूछें।" : "Prices shown are indicative. Confirm final price, stock and delivery with the shop."}
          </p>
        </div>
      </div>
    </footer>
  );
}
