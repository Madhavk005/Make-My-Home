import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Building2,
  Hammer,
  HardHat,
  Paintbrush,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import {
  getBrandsWithCounts,
  getCatalogue,
  getFeaturedProducts,
  getSiteSettings,
} from "@/lib/catalogue";
import { categoryHref } from "@/lib/categories";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { localizedSetting } from "@/lib/settings";
import { isSanityConfigured } from "@/lib/sanity";
import type { CategoryNode, CategoryStage } from "@/lib/types";
import { CatalogueNotice } from "@/components/catalogue-notice";
import { CategoryCard } from "@/components/category-card";
import { ConstructionVideo } from "@/components/construction-video";
import { ContactActions } from "@/components/contact-actions";
import { LanguageSwitch } from "@/components/language-switch";
import { ProductCard } from "@/components/product-card";
import { ProductEnquiryForm } from "@/components/product-enquiry-form";
import { SearchBox } from "@/components/search-box";

const SERVICES = [
  { icon: HardHat, hi: "राज मिस्त्री", en: "Raj Mistri / Mason", descHi: "नींव, दीवार और ढाँचा का काम।", descEn: "Foundation, walls and structural work." },
  { icon: Zap, hi: "इलेक्ट्रिशियन", en: "Electrician", descHi: "वायरिंग, स्विच और लाइटिंग।", descEn: "Wiring, switches and lighting." },
  { icon: Wrench, hi: "प्लंबर", en: "Plumber", descHi: "पाइप, नल और बाथरूम फिटिंग।", descEn: "Pipes, taps and bathroom fittings." },
  { icon: Paintbrush, hi: "पेंटर", en: "Painter", descHi: "दीवार पेंट और फिनिशिंग।", descEn: "Wall painting and finishing." },
  { icon: Hammer, hi: "कारपेंटर", en: "Carpenter", descHi: "लकड़ी और फर्नीचर का काम।", descEn: "Wood and furniture work." },
  { icon: Building2, hi: "टाइल फिटर", en: "Tile Fitter", descHi: "फर्श और दीवार टाइल्स।", descEn: "Floor and wall tiles." },
  { icon: HardHat, hi: "निर्माण मज़दूर", en: "Construction Labour", descHi: "सामान ढोना और सहायक काम।", descEn: "Material handling and support work." },
  { icon: Sparkles, hi: "ठेकेदार", en: "Contractor", descHi: "पूरा निर्माण प्रोजेक्ट संभालना।", descEn: "Complete construction project management." },
];

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) result.push(...flattenCategories(node.children));
  }
  return result;
}

function isConstructionCategory(category: CategoryNode): boolean {
  const text = `${category.slug ?? ""} ${category.name ?? ""}`.toLowerCase();
  return /cement|concrete|stone|sand|dust|iron|rod|aggregate|gravel|bajri|gitti/i.test(text);
}

export default async function HomePage() {
  const [settings, catalogue, featured, allBrands, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCatalogue(),
    getFeaturedProducts().catch(() => []),
    getBrandsWithCounts().catch(() => []),
    getLocale(),
  ]);

  const hi = locale === "hi";
  const t = (key: string) => translate(locale, key as never);
  const { tree, totalProducts } = catalogue;
  const brands = allBrands.filter((brand) => (brand.count ?? 0) > 0);
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const hasCatalogue = tree.length > 0 || totalProducts > 0;
  const demo = !isSanityConfigured;
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber =
    settings?.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    null;

  const allCategories = flattenCategories(tree);
  const constructionCats = allCategories.filter(isConstructionCategory).slice(0, 12);
  const constructionList = constructionCats.length ? constructionCats : allCategories.slice(0, 8);

  const categoryOptions = allCategories.map((category) => ({
    id: category._id,
    name: category.name,
  }));

  return (
    <div className="bg-canvas">
      {/* 1. Header is rendered by layout */}

      {/* 2. Language selection */}
      <section className="border-b border-line bg-white">
        <div className="container flex items-center justify-between gap-3 py-1.5">
          <p className="text-xs font-semibold text-ink-soft">
            {hi ? "भाषा" : "Language"}
          </p>
          <LanguageSwitch />
        </div>
      </section>

      {/* 3. Search and suggestions */}
      <section className="border-b border-line bg-white">
        <div className="container py-2">
          <SearchBox variant="page" />
        </div>
      </section>

      {/* 4. Hero */}
      <section className="relative overflow-hidden">
        <div className="container">
          <div className="grid gap-6 py-6 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
                {hi ? "प्रीमियम होम बिल्डिंग मार्केटप्लेस" : "Premium home building marketplace"}
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
                {hi ? "अपना सपनों का घर बनाएँ" : "Build Your Dream Home"}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
                {hi
                  ? "निर्माण, इंटीरियर और घर सुधार के लिए ज़रूरी हर चीज़ — एक ही जगह।"
                  : "Everything you need for construction, interiors and home improvement — all in one place."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/categories"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-forest px-5 text-sm font-bold text-white transition-colors hover:bg-forest-deep"
                >
                  {hi ? "श्रेणियाँ देखें" : "Explore Categories"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/enquiry"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-forest px-5 text-sm font-bold text-forest transition-colors hover:bg-forest hover:text-white"
                >
                  {hi ? "पूछताछ भेजें" : "Send an Enquiry"}
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
                {hi ? "कोई ऑनलाइन भुगतान नहीं · सीधे दुकानदार से" : "No online payment · Direct from the shop"}
              </p>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
                <Image
                  src="/images/hero-architecture.jpg"
                  alt={hi ? "सुंदर घर का निर्माण" : "Beautiful home construction"}
                  width={900}
                  height={700}
                  priority
                  className="h-[18rem] w-full object-cover sm:h-[22rem]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Main product categories */}
      <section className="py-10 sm:py-14">
        <div className="container">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
                {hi ? "मुख्य श्रेणियाँ" : "Main categories"}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                {hi ? "ज़रूरत के हिसाब से श्रेणी चुनें" : "Choose a category by your need"}
              </h2>
            </div>
            <Link href="/categories" className="text-sm font-bold text-forest hover:text-forest-deep">
              {hi ? "सभी श्रेणियाँ" : "All categories"} →
            </Link>
          </div>

          {tree.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tree.map((category) => (
                <div key={category._id} className="rounded-xl border border-line bg-white p-3 shadow-sm">
                  <CategoryCard category={category} />
                </div>
              ))}
              <Link
                href="/#hire-professional"
                className="flex flex-col items-center justify-center rounded-xl border border-line bg-white p-4 text-center shadow-sm transition-colors hover:border-forest hover:bg-canvas"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-forest/10 text-forest">
                  <HardHat className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="mt-3 text-sm font-bold text-ink">
                  {hi ? "कारीगर बुलाएँ" : "Hire a Professional"}
                </span>
                <span className="mt-1 text-xs text-ink-soft">
                  {hi ? "मिस्त्री, इलेक्ट्रिशियन, प्लंबर और अधिक" : "Mason, electrician, plumber and more"}
                </span>
              </Link>
            </div>
          ) : (
            <CatalogueNotice />
          )}
        </div>
      </section>

      {/* 6. Construction materials discovery */}
      <section className="border-y border-line bg-white py-10 sm:py-14">
        <div className="container">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              {hi ? "निर्माण सामग्री" : "Construction materials"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              {hi ? "निर्माण के लिए ज़रूरी सामग्री" : "Essential materials for construction"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              {hi
                ? "सीमेंट, बालू, गिट्टी, सरिया, पत्थर और अन्य निर्माण सामग्री खोजें।"
                : "Find cement, sand, aggregates, iron rods, stones and other construction materials."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {constructionList.map((category) => (
              <Link
                key={category._id}
                href={categoryHref(category.path)}
                className="group flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 transition-colors hover:border-forest hover:bg-white"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-forest/10 text-forest">
                  <Hammer className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink group-hover:text-forest">
                    {category.name}
                  </span>
                  <span className="block text-xs text-ink-soft">
                    {category.productCount} {hi ? "सामान" : "items"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Popular brands and featured products */}
      <section className="py-10 sm:py-14">
        <div className="container">
          {brands.length > 0 ? (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
                    {hi ? "लोकप्रिय ब्रांड" : "Popular brands"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                    {hi ? "भरोसेमंद ब्रांड" : "Trusted brands"}
                  </h2>
                </div>
                <Link href="/brands" className="text-sm font-bold text-forest hover:text-forest-deep">
                  {hi ? "सभी ब्रांड" : "All brands"} →
                </Link>
              </div>
              <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {brands.slice(0, 12).map((brand) => (
                  <Link
                    key={brand._id}
                    href={`/brands/${encodeURIComponent(brand.slug)}`}
                    className="flex min-h-16 items-center justify-center rounded-xl border border-line bg-white px-3 text-center text-sm font-bold text-ink transition-colors hover:border-forest hover:text-forest"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {featured.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
                  {hi ? "फीचर्ड सामान" : "Featured products"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
                  {hi ? "चुने हुए सामान" : "Featured products"}
                </h2>
              </div>
              <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {featured.slice(0, 8).map((product) => (
                  <li key={product._id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      {/* 8. Hire a Professional */}
      <section id="hire-professional" className="border-y border-line bg-white py-10 sm:py-14">
        <div className="container">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              {hi ? "सेवाएँ" : "Services"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              {hi ? "कारीगर / मिस्त्री की सेवा लें" : "Hire a Professional"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              {hi
                ? "अनुभवी कारीगरों से संपर्क करें। पहले WhatsApp या फॉर्म से पूछताछ करें।"
                : "Connect with skilled professionals. Enquire via WhatsApp or the contact form first."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const message = hi
                ? `नमस्ते ${businessName}, मुझे ${service.hi} की सेवा चाहिए।`
                : `Hello ${businessName}, I need a ${service.en}.`;
              const url = whatsappNumber
                ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
                : null;
              return (
                <div key={service.en} className="rounded-xl border border-line bg-canvas p-4">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-forest/10 text-forest">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-base font-bold text-ink">
                    {hi ? service.hi : service.en}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    {hi ? service.descHi : service.descEn}
                  </p>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-success px-3 text-xs font-bold text-black transition-colors hover:bg-success/90"
                    >
                      {hi ? "पूछताछ करें" : "Enquire"}
                    </a>
                  ) : (
                    <Link
                      href="/contact"
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-forest px-3 text-xs font-bold text-forest transition-colors hover:bg-forest hover:text-white"
                    >
                      {hi ? "संपर्क करें" : "Contact"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Video loop */}
      <section className="py-10 sm:py-14">
        <div className="container">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              {hi ? "निर्माण दृश्य" : "Construction in motion"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              {hi ? "घर बनता हुआ देखें" : "Watch your home being built"}
            </h2>
          </div>
          <ConstructionVideo
            title={hi ? "निर्माण, सामग्री और पूरा घर" : "Construction, materials and completed homes"}
            description={
              hi
                ? "मज़दूर, सामग्री और तैयार घर — एक छोटा वीडियो।"
                : "Workers, materials and finished homes — a short looping video."
            }
          />
        </div>
      </section>

      {/* 10. Product enquiry */}
      <section className="border-y border-line bg-white py-10 sm:py-14">
        <div className="container">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              {hi ? "पूछताछ" : "Enquiry"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              {hi ? "प्रोडक्ट पूछताछ" : "Product Enquiry"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              {hi
                ? "जो सामान चाहिए, उसका नाम, श्रेणी, ब्रांड, साइज़ और मात्रा भरें। WhatsApp पर भेजें।"
                : "Enter the product, category, brand, size and quantity you need. Send on WhatsApp."}
            </p>
          </div>
          <ProductEnquiryForm
            whatsappNumber={whatsappNumber}
            businessName={businessName}
            categories={categoryOptions}
          />
        </div>
      </section>

      {/* 11. Customer care */}
      <section id="customer-care" className="py-10 sm:py-14">
        <div className="container">
          <div className="rounded-2xl border border-line bg-forest p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-forest">
              {hi ? "कस्टमर केयर" : "Customer Care"}
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {hi ? "हम आपकी मदद के लिए हैं" : "We are here to help"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              {hi
                ? "सामान, कीमत, उपलब्धता या डिलीवरी के बारे में किसी भी सवाल के लिए संपर्क करें।"
                : "Contact us for any questions about products, prices, availability or delivery."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-forest transition-colors hover:bg-canvas"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {hi ? "अभी कॉल करें" : "Call Now"}
                </a>
              ) : (
                <span className="text-sm text-white/70">
                  {hi ? "फोन नंबर अभी नहीं जोड़ा गया।" : "Phone number not configured yet."}
                </span>
              )}
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                    hi ? `नमस्ते ${businessName}, मुझे मदद चाहिए।` : `Hello ${businessName}, I need help.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-black transition-colors hover:bg-success/90"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {hi ? "WhatsApp करें" : "WhatsApp Now"}
                </a>
              ) : null}
            </div>
            {phone ? (
              <p className="mt-4 text-sm font-semibold text-white/90">{phone}</p>
            ) : null}
          </div>
        </div>
      </section>

      {demo ? (
        <div className="container pb-12">
          <p className="border-t border-line pt-5 text-center text-[11px] leading-relaxed text-ink-soft">
            {t("homeDemoNotice")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
