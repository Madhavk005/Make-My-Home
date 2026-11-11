import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  BadgeCheck,
  Building2,
  Drill,
  Hammer,
  HardHat,
  Headset,
  Paintbrush,
  Phone,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
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
import { getSettingWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { isDemoDataEnabled } from "@/lib/sanity";
import type { CategoryNode } from "@/lib/types";
import { CatalogueNotice } from "@/components/catalogue-notice";
import { CategoryCard } from "@/components/category-card";
import { ConstructionVideo } from "@/components/construction-video";
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
  const { tree } = catalogue;
  const brands = allBrands.filter((brand) => (brand.count ?? 0) > 0);
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const demo = isDemoDataEnabled;
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const customerCareWhatsAppUrl = buildWhatsAppUrl(
    whatsappNumber,
    hi
      ? `नमस्ते ${businessName}, मुझे सामग्री चुनने में मदद चाहिए।`
      : `Hello ${businessName}, I need help choosing materials.`,
  );
  const equipmentWhatsAppUrl = buildWhatsAppUrl(
    whatsappNumber,
    hi
      ? `नमस्ते ${businessName}, मुझे उपकरण किराये पर चाहिए। उपलब्धता और दर बताइए।`
      : `Hello ${businessName}, I want equipment on rent. Please confirm availability and rate.`,
  );

  const allCategories = flattenCategories(tree);
  const constructionCats = allCategories.filter(isConstructionCategory).slice(0, 12);
  const constructionList = constructionCats.length ? constructionCats : allCategories.slice(0, 8);

  const categoryOptions = allCategories.map((category) => ({
    id: category._id,
    name: category.name,
  }));

  return (
    <div className="bg-canvas">
      {/* 1. Hero */}
      <section className="hero-panel relative overflow-hidden text-white">
        <div className="container">
          <div className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:py-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                {hi ? "निर्माण सामग्री मार्केटप्लेस" : "Building materials marketplace"}
              </p>
              <h1 className="type-display mt-5 font-extrabold text-white">
                {hi ? (
                  <>अपना सपनों का <span className="text-accent">घर बनाएँ</span></>
                ) : (
                  <>Build Your <span className="text-accent">Dream Home</span></>
                )}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                {hi
                  ? "निर्माण सामग्री खोजें, उत्पादों की तुलना करें और सत्यापित दुकानदारों से सीधे जुड़ें — एक ही जगह।"
                  : "Discover construction materials, compare products and connect directly with verified suppliers — in one place."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/categories"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-deep"
                >
                  {hi ? "श्रेणियाँ देखें" : "Explore Categories"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/enquiry"
                  className="hero-accent inline-flex min-h-12 items-center gap-2 rounded-lg px-6 text-sm font-bold transition-colors"
                >
                  {hi ? "पूछताछ भेजें" : "Send an Enquiry"}
                </Link>
              </div>
              <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                  {hi ? "सत्यापित दुकानदार" : "Verified suppliers"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-accent" aria-hidden="true" />
                  {hi ? "साइट पर डिलीवरी" : "Site delivery"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                  {hi ? "कोई ऑनलाइन भुगतान नहीं" : "No online payment"}
                </span>
              </p>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-30px_rgb(0_0_0_/_0.6)]">
                <Image
                  src="/images/hero-architecture.jpg"
                  alt={hi ? "निर्माण स्थल पर घर का निर्माण" : "Home construction at a building site"}
                  width={900}
                  height={700}
                  priority
                  className="h-64 w-full object-cover sm:h-80 lg:h-[28rem]"
                />
              </div>
              <p className="absolute -bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-charcoal/95 px-4 py-2 text-[11px] font-bold text-accent shadow-lg backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {hi ? "सीधे दुकान से असली दाम" : "Real shop prices, direct from the shop"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Prominent search */}
      <section className="border-b border-line bg-surface">
        <div className="container py-4 sm:py-5">
          <SearchBox variant="page" />
        </div>
      </section>

      {/* 3. Language strip */}
      <div className="border-b border-line bg-canvas">
        <div className="container flex items-center justify-between gap-3 py-1.5">
          <p className="text-xs font-semibold text-ink-soft">
            {hi ? "भाषा" : "Language"}
          </p>
          <LanguageSwitch />
        </div>
      </div>

      {/* 4. Primary categories */}
      <section className="py-10 sm:py-14">
        <div className="container">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="type-eyebrow no-rule">{hi ? "मुख्य श्रेणियाँ" : "Main categories"}</p>
              <h2 className="type-h2 mt-2 text-ink">
                {hi ? "ज़रूरत के हिसाब से श्रेणी चुनें" : "Choose a category by your need"}
              </h2>
            </div>
            <Link href="/categories" className="text-sm font-bold text-link hover:text-link-hover hover:underline">
              {hi ? "सभी श्रेणियाँ" : "All categories"} →
            </Link>
          </div>

          {tree.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tree.map((category) => (
                <div
                  key={category._id}
                  className="rounded-xl border border-line bg-surface p-3 shadow-sm transition-colors hover:border-primary/40"
                >
                  <CategoryCard category={category} />
                </div>
              ))}
              <Link
                href="/#hire-professional"
                className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface p-4 text-center shadow-sm transition-colors hover:border-primary hover:bg-sand"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary-soft text-primary-deep">
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

      {/* 5. Construction materials discovery */}
      <section className="border-y border-line bg-surface py-10 sm:py-14">
        <div className="container">
          <div className="mb-8">
            <p className="type-eyebrow no-rule">{hi ? "निर्माण सामग्री" : "Construction materials"}</p>
            <h2 className="type-h2 mt-2 text-ink">
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
                className="group flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 transition-colors hover:border-primary hover:bg-surface"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-sand text-primary-deep">
                  <Hammer className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink group-hover:text-primary-deep">
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

      {/* 6. Featured products */}
      {featured.length > 0 ? (
        <section className="py-10 sm:py-14">
          <div className="container">
            <div className="mb-6">
              <p className="type-eyebrow no-rule">{hi ? "फीचर्ड सामान" : "Featured products"}</p>
              <h2 className="type-h2 mt-2 text-ink">
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
          </div>
        </section>
      ) : null}

      {/* 7. Verified suppliers & vendors */}
      <section className="border-y border-line bg-sand py-8 sm:py-10">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: hi ? "सत्यापित विक्रेता" : "Verified vendors", text: hi ? "लिस्टिंग से पहले विक्रेता की जाँच होती है।" : "Every supplier is verified before listing." },
              { icon: BadgeCheck, title: hi ? "सीधे दुकान की कीमत" : "Direct shop pricing", text: hi ? "बिना बिचौलिए, बिना नकली छूट।" : "No middlemen, no fake discounts." },
              { icon: Truck, title: hi ? "साइट पर डिलीवरी" : "Site delivery", text: hi ? "प्रोजेक्ट साइट पर सामग्री मँगवाएँ।" : "Material delivered to your project site." },
              { icon: Headset, title: hi ? "WhatsApp सहायता" : "WhatsApp support", text: hi ? "असली इंसान से हिंदी या English में बात करें।" : "Talk to a real person, in Hindi or English." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface text-success-text shadow-sm">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-ink">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{item.text}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Special offers — project & bulk rates (no invented discounts) */}
      <section className="py-10 sm:py-14">
        <div className="container">
          <div className="overflow-hidden rounded-2xl border border-accent/50 bg-accent-soft p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-charcoal">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                {hi ? "ऑफ़र · प्रोजेक्ट रेट" : "Offers · Project rates"}
              </p>
              <h2 className="type-h2 mt-3 text-ink">
                {hi ? "घर बनाने की पूरी सामग्री, एक ही प्रोजेक्ट रेट पर" : "Your whole build, on one project rate"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {hi
                  ? "पूरी सामग्री की सूची भेजिए — सीमेंट से सरिया तक — और पूरे प्रोजेक्ट के लिए एक पक्की दर पाइए। कोई मनमाना डिस्काउंट नहीं, सिर्फ़ पक्की अंतिम कीमत।"
                  : "Send us your full material list — from cement to rods — and get one consolidated rate for the whole project. No arbitrary discounts, just a confirmed final price."}
              </p>
            </div>
            <div className="mt-5 shrink-0 lg:mt-0">
              <Link href="/enquiry" className="btn btn-accent btn-lg w-full sm:w-auto">
                {hi ? "सामग्री सूची भेजें" : "Send your material list"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Popular brands */}
      {brands.length > 0 ? (
        <section className="border-t border-line bg-surface pb-10 pt-2 sm:pb-14">
          <div className="container">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="type-eyebrow no-rule">{hi ? "लोकप्रिय ब्रांड" : "Popular brands"}</p>
                <h2 className="type-h2 mt-2 text-ink">{hi ? "भरोसेमंद ब्रांड" : "Trusted brands"}</h2>
              </div>
              <Link href="/brands" className="text-sm font-bold text-link hover:text-link-hover hover:underline">
                {hi ? "सभी ब्रांड" : "All brands"} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {brands.slice(0, 12).map((brand) => (
                <Link
                  key={brand._id}
                  href={`/brands/${encodeURIComponent(brand.slug)}`}
                  className="flex min-h-16 items-center justify-center rounded-xl border border-line bg-surface px-3 text-center text-sm font-bold text-ink transition-colors hover:border-primary hover:text-primary-deep"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 10. Hire a Professional */}
      <section id="hire-professional" className="border-t border-line bg-canvas py-10 sm:py-14">
        <div className="container">
          <div className="mb-8">
            <p className="type-eyebrow no-rule">{hi ? "सेवाएँ" : "Services"}</p>
            <h2 className="type-h2 mt-2 text-ink">
              {hi ? "कारीगर / मिस्त्री की सेवा लें" : "Hire a Professional"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              {hi
                ? "अनुभवी कारीगरों से संपर्क करें। पहले WhatsApp या फ़ॉर्म से पूछताछ करें।"
                : "Connect with skilled professionals. Enquire via WhatsApp or the contact form first."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              const message = hi
                ? `नमस्ते ${businessName}, मुझे ${service.hi} की सेवा चाहिए।`
                : `Hello ${businessName}, I need a ${service.en}.`;
              const url = buildWhatsAppUrl(whatsappNumber, message);
              return (
                <div key={service.en} className="rounded-xl border border-line bg-surface p-4 shadow-sm">
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-sand text-primary-deep">
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
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-success px-3 text-xs font-bold text-charcoal transition-colors hover:bg-success-text hover:text-white"
                    >
                      {hi ? "पूछताछ करें" : "Enquire"}
                    </a>
                  ) : (
                    <Link
                      href="/contact"
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary px-3 text-xs font-bold text-primary-deep transition-colors hover:bg-primary hover:text-white"
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

      {/* 11. Video loop */}
      <section className="py-10 sm:py-14">
        <div className="container">
          <div className="mb-6">
            <p className="type-eyebrow no-rule">{hi ? "निर्माण दृश्य" : "Construction in motion"}</p>
            <h2 className="type-h2 mt-2 text-ink">
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

      {/* 12. Equipment rental */}
      <section className="pb-10 sm:pb-14">
        <div className="container">
          <div className="grid overflow-hidden rounded-2xl bg-charcoal text-white sm:grid-cols-[1fr_auto]">
            <div className="p-6 sm:p-8">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-accent">
                <Drill className="h-3.5 w-3.5" aria-hidden="true" />
                {hi ? "उपकरण किराये पर" : "Equipment on rent"}
              </p>
              <h2 className="type-h2 mt-3 text-white">
                {hi ? "उपकरण किराये पर चाहिए? एक कॉल में पक्का करें" : "Need equipment? One call confirms it"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
                {hi
                  ? "मिक्सर, स्कैफोल्डिंग, कटर — जो उपकरण चाहिए उसकी सूची बताइए। हम उपलब्धता और किराया पक्की करके बताएँगे।"
                  : "Mixers, scaffolding, cutters — tell us the equipment you need and we will confirm availability and the rental rate."}
              </p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
                {hi ? "कोई अग्रिम भुगतान नहीं · पिक-अप/डिलीवरी चर्चा योग्य" : "No advance payment · Pick-up / delivery negotiable"}
              </p>
            </div>
            <div className="flex flex-col items-stretch justify-center gap-3 border-t border-white/10 bg-white/5 p-6 sm:border-l sm:border-t-0 sm:p-8">
              {equipmentWhatsAppUrl ? (
                <a
                  href={equipmentWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-charcoal transition-colors hover:bg-success-text hover:text-white sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {hi ? "WhatsApp पर पूछें" : "Ask on WhatsApp"}
                </a>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/25 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {phone}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 13. Product enquiry */}
      <section className="border-t border-line bg-surface py-10 sm:py-14">
        <div className="container">
          <div className="mb-6">
            <p className="type-eyebrow no-rule">{hi ? "पूछताछ" : "Enquiry"}</p>
            <h2 className="type-h2 mt-2 text-ink">
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

      {/* 14. Customer care — dark premium panel */}
      <section id="customer-care" className="py-10 sm:py-14">
        <div className="container">
          <div className="rounded-2xl border border-white/10 bg-charcoal p-6 text-white sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent">
              {hi ? "कस्टमर केयर" : "Customer Care"}
            </p>
            <h2 className="type-h2 mt-2 text-white">
              {hi ? "हम आपकी मदद के लिए हैं" : "We are here to help"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              {hi
                ? "सामान, कीमत, उपलब्धता या डिलीवरी के बारे में किसी भी सवाल के लिए संपर्क करें।"
                : "Contact us for any questions about products, prices, availability or delivery."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {phone ? (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-charcoal transition-colors hover:bg-canvas"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {hi ? "अभी कॉल करें" : "Call Now"}
                </a>
              ) : (
                <span className="text-sm text-white/70">
                  {hi ? "फ़ोन नंबर अभी नहीं जोड़ा गया।" : "Phone number not configured yet."}
                </span>
              )}
              {customerCareWhatsAppUrl ? (
                <a
                  href={customerCareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-charcoal transition-colors hover:bg-success-text hover:text-white"
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
