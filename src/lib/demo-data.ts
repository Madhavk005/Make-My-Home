/**
 * Demo / mock data for the Make My Home storefront.
 *
 * This data is used ONLY when Sanity is not configured (no project ID /
 * dataset in environment variables). It lets the site run as a standalone
 * demo without a CMS. It is never imported into Sanity and never treated as
 * real business data.
 *
 * Integrity rules used here:
 * - Only the original ten sample products carry a sample price.
 * - Every additional sample product is explicitly "price on request" or
 *   "price not supplied". No price, discount, rating or stock number is
 *   invented to fill the interface.
 * - Product images are intentionally absent. The UI shows a labelled material
 *   study instead of pretending a stock photo is the real product.
 */

import { assembleFacets, type CatalogQueryInput, type FacetProductRow } from "./queries";
import type {
  Availability,
  Brand,
  BrandRef,
  Category,
  CategoryStage,
  Facets,
  PriceStatus,
  ProductCardData,
  ProductDetail,
  ProductVariant,
  SiteSettings,
  SortKey,
  Specification,
  VariantAttribute,
} from "./types";
import { fuzzyIncludes } from "./search";

export const demoSiteSettings: SiteSettings = {
  businessName: "Make My Home",
  tagline:
    "नींव से फिनिशिंग तक — सीमेंट, सरिया, पत्थर, टाइल्स, तार, पाइप और घर का हर सामान।",
  taglineEn:
    "From foundation to finishing — cement, steel, stone, tiles, wires, pipes and everything a home needs.",
  whatsappNumber: "919876543210",
  phone: "919876543210",
  email: "hello@makemyhome.example.in",
  address: "मुख्य बाजार, निर्माण नगर, जयपुर, राजस्थान",
  addressEn: "Main Market, Nirman Nagar, Jaipur, Rajasthan",
  serviceArea: "जयपुर और आसपास के इलाके",
  serviceAreaEn: "Jaipur and nearby areas",
  openingHours: "सुबह 9:00 बजे से रात 8:00 बजे तक",
  openingHoursEn: "9:00 am to 8:00 pm",
  priceNote:
    "दिखाई गई कीमतें सिर्फ़ अनुमान हैं। पक्की कीमत, स्टॉक और डिलीवरी दुकानदार से पूछें।",
  priceNoteEn:
    "Prices shown are indicative only. Confirm the final price, stock and delivery with the shop.",
  announcement:
    "सीमेंट, सरिया और पत्थर के दाम आज पूछें — दुकानदार सीधे WhatsApp पर जवाब देंगे।",
  announcementEn:
    "Ask today's rates for cement, steel and stone — the shop replies directly on WhatsApp.",
  footerNote:
    "Make My Home एक निर्माण सामग्री कैटलॉग है। सामान चुनें, सूची बनाएँ और दुकानदार से सीधे बात करें। स्वीकृत कोटेशन का भुगतान UPI से ऑनलाइन किया जा सकता है।",
  footerNoteEn:
    "Make My Home is a building-materials catalogue. Choose products, build a list and talk to the shop directly. An approved quotation can be paid online by UPI.",
};

type DemoCategoryInput = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  order: number;
  stage: CategoryStage;
  description: string;
};

function category(input: DemoCategoryInput): Category {
  return {
    _id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    parentId: input.parentId ?? null,
    order: input.order,
    stage: input.stage,
  };
}

export const demoCategories: Category[] = [
  // ── Top-level: foundation & structure ──────────────────────────────────
  category({
    id: "demo-cat-cement",
    name: "सीमेंट और कंक्रीट",
    slug: "cement-concrete",
    order: 10,
    stage: "structure",
    description: "OPC, PPC, व्हाइट सीमेंट, ईंट और कंक्रीट ब्लॉक — नींव और ढाँचे के लिए।",
  }),
  category({
    id: "demo-cat-opc",
    name: "OPC सीमेंट",
    slug: "opc-cement",
    parentId: "demo-cat-cement",
    order: 11,
    stage: "structure",
    description: "तेज़ मज़बूती के लिए OPC ग्रेड सीमेंट।",
  }),
  category({
    id: "demo-cat-opc-53",
    name: "OPC 53 ग्रेड",
    slug: "opc-53",
    parentId: "demo-cat-opc",
    order: 1,
    stage: "structure",
    description: "RCC और ऊँची मज़बूती वाले काम के लिए OPC 53 ग्रेड।",
  }),
  category({
    id: "demo-cat-opc-43",
    name: "OPC 43 ग्रेड",
    slug: "opc-43",
    parentId: "demo-cat-opc",
    order: 2,
    stage: "structure",
    description: "सामान्य प्लास्टर और चिनाई के लिए OPC 43 ग्रेड।",
  }),
  category({
    id: "demo-cat-ppc",
    name: "PPC सीमेंट",
    slug: "ppc-cement",
    parentId: "demo-cat-cement",
    order: 12,
    stage: "structure",
    description: "प्लास्टर और लंबे समय की मज़बूती के लिए पोर्टलैंड पोज़ोलाना सीमेंट।",
  }),
  category({
    id: "demo-cat-white-cement",
    name: "व्हाइट सीमेंट",
    slug: "white-cement",
    parentId: "demo-cat-cement",
    order: 13,
    stage: "structure",
    description: "फिनिशिंग, टाइल जोड़ने और सफेदी के काम के लिए।",
  }),
  category({
    id: "demo-cat-bricks",
    name: "ईंट और ब्लॉक",
    slug: "bricks-blocks",
    parentId: "demo-cat-cement",
    order: 14,
    stage: "structure",
    description: "मिट्टी की ईंट, AAC ब्लॉक और कंक्रीट ब्लॉक।",
  }),
  category({
    id: "demo-cat-sand",
    name: "रेत, गिट्टी और एग्रीगेट",
    slug: "sand-aggregates",
    order: 20,
    stage: "structure",
    description: "बालू, रोड़ी, गिट्टी और स्टोन डस्ट — निर्माण की बुनियाद।",
  }),
  category({
    id: "demo-cat-river-sand",
    name: "नदी की बालू",
    slug: "river-sand",
    parentId: "demo-cat-sand",
    order: 21,
    stage: "structure",
    description: "प्लास्टर और कंक्रीट के लिए बारीक बालू।",
  }),
  category({
    id: "demo-cat-aggregate",
    name: "गिट्टी और रोड़ी",
    slug: "aggregate",
    parentId: "demo-cat-sand",
    order: 22,
    stage: "structure",
    description: "10mm, 20mm और 40mm एग्रीगेट।",
  }),
  category({
    id: "demo-cat-stone-dust",
    name: "स्टोन डस्ट",
    slug: "stone-dust",
    parentId: "demo-cat-sand",
    order: 23,
    stage: "structure",
    description: "प्लास्टर और फ्लोर बेस के लिए स्टोन डस्ट।",
  }),
  category({
    id: "demo-cat-steel",
    name: "सरिया और स्टील",
    slug: "steel-tmt",
    order: 30,
    stage: "structure",
    description: "TMT सरिया, MS एंगल, चैनल और बाइंडिंग वायर।",
  }),
  category({
    id: "demo-cat-tmt",
    name: "TMT सरिया",
    slug: "tmt-bars",
    parentId: "demo-cat-steel",
    order: 31,
    stage: "structure",
    description: "Fe 500 और Fe 500D ग्रेड के TMT बार।",
  }),
  category({
    id: "demo-cat-ms-sections",
    name: "MS एंगल और चैनल",
    slug: "ms-sections",
    parentId: "demo-cat-steel",
    order: 32,
    stage: "structure",
    description: "शेड, गेट और फैब्रिकेशन के लिए MS सेक्शन।",
  }),
  category({
    id: "demo-cat-binding-wire",
    name: "बाइंडिंग वायर",
    slug: "binding-wire",
    parentId: "demo-cat-steel",
    order: 33,
    stage: "structure",
    description: "सरिया बाँधने के लिए मुलायम तार।",
  }),

  // ── Finishing ──────────────────────────────────────────────────────────
  category({
    id: "demo-cat-stone",
    name: "पत्थर और मार्बल",
    slug: "stone-marble",
    order: 40,
    stage: "finishing",
    description: "कोटा स्टोन, जैसलमेर स्टोन, मार्बल और ग्रेनाइट।",
  }),
  category({
    id: "demo-cat-kota",
    name: "कोटा स्टोन",
    slug: "kota-stone",
    parentId: "demo-cat-stone",
    order: 41,
    stage: "finishing",
    description: "फर्श और सीढ़ियों के लिए टिकाऊ कोटा स्टोन।",
  }),
  category({
    id: "demo-cat-kota-polished",
    name: "पॉलिश कोटा स्टोन",
    slug: "polished-kota",
    parentId: "demo-cat-kota",
    order: 1,
    stage: "finishing",
    description: "चमकदार फिनिश वाला कोटा स्टोन।",
  }),
  category({
    id: "demo-cat-jaisalmer",
    name: "जैसलमेर स्टोन",
    slug: "jaisalmer-stone",
    parentId: "demo-cat-stone",
    order: 42,
    stage: "finishing",
    description: "पीले रंग का प्राकृतिक जैसलमेर पत्थर।",
  }),
  category({
    id: "demo-cat-marble-granite",
    name: "मार्बल और ग्रेनाइट",
    slug: "marble-granite",
    parentId: "demo-cat-stone",
    order: 43,
    stage: "finishing",
    description: "सीढ़ी, किचन और ड्राइंग रूम के लिए मार्बल व ग्रेनाइट।",
  }),
  category({
    id: "demo-cat-tiles",
    name: "टाइल्स और फ्लोरिंग",
    slug: "tiles-flooring",
    order: 50,
    stage: "finishing",
    description: "विट्रिफाइड, सेरामिक टाइल्स और फर्श की फिनिशिंग।",
  }),
  category({
    id: "demo-cat-vitrified",
    name: "विट्रिफाइड टाइल्स",
    slug: "vitrified-tiles",
    parentId: "demo-cat-tiles",
    order: 51,
    stage: "finishing",
    description: "कम पानी सोखने वाली मज़बूत विट्रिफाइड टाइल्स।",
  }),
  category({
    id: "demo-cat-ceramic",
    name: "सेरामिक टाइल्स",
    slug: "ceramic-tiles",
    parentId: "demo-cat-tiles",
    order: 52,
    stage: "finishing",
    description: "दीवार और हल्के फर्श के लिए सेरामिक टाइल्स।",
  }),
  category({
    id: "demo-cat-flooring-stone",
    name: "फ्लोरिंग स्टोन",
    slug: "flooring-stone",
    parentId: "demo-cat-tiles",
    order: 53,
    stage: "finishing",
    description: "प्राकृतिक पत्थर के फर्श।",
  }),
  category({
    id: "demo-cat-sanitary",
    name: "सैनीटरीवेयर",
    slug: "sanitaryware",
    order: 60,
    stage: "finishing",
    description: "बेसिन, टॉयलेट, नल, शावर और बाथरूम फिटिंग।",
  }),
  category({
    id: "demo-cat-wash-basins",
    name: "वॉश बेसिन",
    slug: "wash-basins",
    parentId: "demo-cat-sanitary",
    order: 61,
    stage: "finishing",
    description: "वॉल हंग और टेबल टॉप बेसिन।",
  }),
  category({
    id: "demo-cat-toilets",
    name: "टॉयलेट और कमोड",
    slug: "toilets",
    parentId: "demo-cat-sanitary",
    order: 62,
    stage: "finishing",
    description: "वॉल हंग और फ्लोर माउंटेड कमोड।",
  }),
  category({
    id: "demo-cat-faucets",
    name: "नल और शावर",
    slug: "faucets-showers",
    parentId: "demo-cat-sanitary",
    order: 63,
    stage: "finishing",
    description: "बाथरूम और किचन के नल, शावर और एक्सेसरीज़।",
  }),
  category({
    id: "demo-cat-lighting",
    name: "लाइटिंग",
    slug: "lighting",
    order: 70,
    stage: "finishing",
    description: "LED बल्ब, ट्यूब लाइट, पंखे और लाइटिंग फिटिंग।",
  }),
  category({
    id: "demo-cat-led",
    name: "LED बल्ब",
    slug: "led-bulbs",
    parentId: "demo-cat-lighting",
    order: 71,
    stage: "finishing",
    description: "घर और दुकान के लिए ऊर्जा-कुशल LED बल्ब।",
  }),
  category({
    id: "demo-cat-tube",
    name: "ट्यूब लाइट",
    slug: "tube-lights",
    parentId: "demo-cat-lighting",
    order: 72,
    stage: "finishing",
    description: "कमरे, हॉल और बाहर के लिए ट्यूब लाइट।",
  }),
  category({
    id: "demo-cat-fans",
    name: "पंखे",
    slug: "fans",
    parentId: "demo-cat-lighting",
    order: 73,
    stage: "finishing",
    description: "सीलिंग, टेबल और एग्जॉस्ट फैन।",
  }),
  category({
    id: "demo-cat-hardware",
    name: "हार्डवेयर और औज़ार",
    slug: "hardware-tools",
    order: 80,
    stage: "finishing",
    description: "कील, बोल्ट, हिंज, हथौड़ा, पेचकस और दरवाज़े की फिटिंग।",
  }),
  category({
    id: "demo-cat-fasteners",
    name: "फास्टनर और बोल्ट",
    slug: "fasteners",
    parentId: "demo-cat-hardware",
    order: 81,
    stage: "finishing",
    description: "कील, स्क्रू, बोल्ट और नट।",
  }),
  category({
    id: "demo-cat-hand-tools",
    name: "हाथ के औज़ार",
    slug: "hand-tools",
    parentId: "demo-cat-hardware",
    order: 82,
    stage: "finishing",
    description: "हथौड़ा, पेचकस, प्लायर और टूल किट।",
  }),
  category({
    id: "demo-cat-door-fittings",
    name: "दरवाज़े की फिटिंग",
    slug: "door-fittings",
    parentId: "demo-cat-hardware",
    order: 83,
    stage: "finishing",
    description: "हिंज, हैंडल, लॉक और टावर बोल्ट।",
  }),

  // ── Services: electrical & plumbing ────────────────────────────────────
  category({
    id: "demo-cat-wires",
    name: "तार और इलेक्ट्रिकल",
    slug: "wires-electrical",
    order: 90,
    stage: "services",
    description: "घर की वायरिंग, स्विच, सॉकेट, MCB और इलेक्ट्रिकल सामान।",
  }),
  category({
    id: "demo-cat-house-wires",
    name: "घर की वायरिंग",
    slug: "house-wires",
    parentId: "demo-cat-wires",
    order: 91,
    stage: "services",
    description: "FRLS और FR तार — 1.0 से 4.0 sq mm तक।",
  }),
  category({
    id: "demo-cat-switches",
    name: "स्विच और सॉकेट",
    slug: "switches-sockets",
    parentId: "demo-cat-wires",
    order: 92,
    stage: "services",
    description: "मॉड्यूलर स्विच, सॉकेट और प्लेट।",
  }),
  category({
    id: "demo-cat-mcb",
    name: "MCB और डिस्ट्रीब्यूशन",
    slug: "mcb-distribution",
    parentId: "demo-cat-wires",
    order: 93,
    stage: "services",
    description: "MCB, RCCB और डिस्ट्रीब्यूशन बोर्ड।",
  }),
  category({
    id: "demo-cat-pipes",
    name: "पाइप और प्लंबिंग",
    slug: "pipes-plumbing",
    order: 100,
    stage: "services",
    description: "PVC, CPVC पाइप, फिटिंग, वाल्व और प्लंबिंग सामान।",
  }),
  category({
    id: "demo-cat-pvc",
    name: "PVC पाइप",
    slug: "pvc-pipes",
    parentId: "demo-cat-pipes",
    order: 101,
    stage: "services",
    description: "ड्रेनेज और कंड्यूट के लिए PVC पाइप।",
  }),
  category({
    id: "demo-cat-cpvc",
    name: "CPVC पाइप",
    slug: "cpvc-pipes",
    parentId: "demo-cat-pipes",
    order: 102,
    stage: "services",
    description: "गर्म पानी की लाइन के लिए CPVC पाइप।",
  }),
  category({
    id: "demo-cat-fittings",
    name: "पाइप फिटिंग",
    slug: "pipe-fittings",
    parentId: "demo-cat-pipes",
    order: 103,
    stage: "services",
    description: "एल्बो, टी, यूनियन, वाल्व और जॉइंट।",
  }),
];

export const demoBrands: Brand[] = [
  { _id: "demo-brand-ultratech", name: "UltraTech", slug: "ultratech", order: 10 },
  { _id: "demo-brand-ambuja", name: "Ambuja", slug: "ambuja", order: 20 },
  { _id: "demo-brand-acc", name: "ACC", slug: "acc", order: 30 },
  { _id: "demo-brand-jsw", name: "JSW", slug: "jsw", order: 40 },
  { _id: "demo-brand-tata", name: "TATA", slug: "tata", order: 50 },
  { _id: "demo-brand-finolex", name: "Finolex", slug: "finolex", order: 60 },
  { _id: "demo-brand-havells", name: "Havells", slug: "havells", order: 70 },
  { _id: "demo-brand-kajaria", name: "Kajaria", slug: "kajaria", order: 80 },
  { _id: "demo-brand-cera", name: "Cera", slug: "cera", order: 90 },
  { _id: "demo-brand-somany", name: "Somany", slug: "somany", order: 100 },
  { _id: "demo-brand-astral", name: "Astral", slug: "astral", order: 110 },
  { _id: "demo-brand-legrand", name: "Legrand", slug: "legrand", order: 120 },
  { _id: "demo-brand-philips", name: "Philips", slug: "philips", order: 130 },
  { _id: "demo-brand-birla-white", name: "Birla White", slug: "birla-white", order: 140 },
  { _id: "demo-brand-polycab", name: "Polycab", slug: "polycab", order: 150 },
  { _id: "demo-brand-local", name: "Local", slug: "local", order: 160 },
];

function brandRef(name: string): BrandRef | null {
  const brand = demoBrands.find((item) => item.name === name);
  if (!brand) return null;
  return { name: brand.name, slug: brand.slug, logo: null };
}

function categoryRef(id: string) {
  const found = demoCategories.find((item) => item._id === id);
  if (!found) throw new Error(`Unknown demo category: ${id}`);
  return { _id: found._id, name: found.name, slug: found.slug };
}

type DemoProductInput = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  categoryId: string;
  unit: string;
  price?: number;
  priceStatus?: PriceStatus;
  availability?: Availability;
  shortDescription: string;
  featured?: boolean;
  specifications: Specification[];
  variants?: ProductVariant[];
  keywords?: string[];
};

type DemoRecord = {
  card: ProductCardData;
  detail: ProductDetail;
};

function demoRecord(input: DemoProductInput): DemoRecord {
  const status: PriceStatus =
    input.priceStatus ?? (typeof input.price === "number" && input.price > 0 ? "fixed" : "on_request");
  const variants = input.variants ?? [];
  const card: ProductCardData = {
    _id: input.id,
    name: input.name,
    slug: input.slug,
    sku: input.sku,
    brand: input.brand ? brandRef(input.brand) : null,
    category: categoryRef(input.categoryId),
    image: null,
    price: typeof input.price === "number" ? input.price : null,
    priceStatus: status,
    unit: input.unit,
    availability: input.availability ?? "on_request",
    shortDescription: input.shortDescription,
    featured: input.featured ?? false,
    isDemo: true,
    variantCount: variants.length,
    fromPrice:
      typeof input.price === "number"
        ? input.price
        : variants.find((variant) => variant.price && variant.price > 0)?.price ?? null,
    specSummary: input.specifications.slice(0, 3),
  };

  const detail: ProductDetail = {
    ...card,
    images: [],
    description: [
      {
        _type: "block",
        _key: "description",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "span",
            text: `${input.shortDescription} यह एक डेमो प्रविष्टि है — असली फोटो, कीमत और स्टॉक दुकानदार Sanity Studio से जोड़ेगा।`,
            marks: [],
          },
        ],
      },
    ],
    specifications: input.specifications,
    variants,
    keywords: input.keywords ?? [],
  };

  return { card, detail };
}

const records: DemoRecord[] = [
  demoRecord({
    id: "demo-prod-1",
    name: "UltraTech OPC 53 Grade Cement",
    slug: "ultratech-opc-53-cement",
    sku: "UT-OPC53-50KG",
    brand: "UltraTech",
    categoryId: "demo-cat-opc-53",
    unit: "बोरी",
    price: 420,
    availability: "available",
    shortDescription: "50 kg बोरी, OPC 53 ग्रेड — RCC और मज़बूत ढाँचे के लिए।",
    featured: true,
    specifications: [
      { name: "ग्रेड", value: "OPC 53", group: "सीमेंट" },
      { name: "बोरी का वज़न", value: "50 kg", group: "पैकिंग" },
      { name: "मानक", value: "IS 12269", group: "सीमेंट" },
    ],
    keywords: ["सीमेंट", "ultratech", "opc", "53 grade", "बोरी"],
  }),
  demoRecord({
    id: "demo-prod-2",
    name: "JSW TMT Fe 500D Steel Bar",
    slug: "tmt-fe-500d-steel-bar",
    sku: "JSW-TMT-500D",
    brand: "JSW",
    categoryId: "demo-cat-tmt",
    unit: "किग्रा",
    price: 685,
    availability: "available",
    shortDescription: "Fe 500D ग्रेड TMT सरिया — 12mm, 16mm और 20mm साइज़ में।",
    featured: true,
    specifications: [
      { name: "ग्रेड", value: "Fe 500D", group: "स्टील" },
      { name: "सामग्री", value: "माइल्ड स्टील", group: "स्टील" },
      { name: "लंबाई", value: "12 मीटर", group: "साइज़" },
    ],
    variants: [
      {
        label: "12mm × 12 मीटर",
        sku: "JSW-TMT-12MM-12M",
        attributes: [
          { name: "साइज़", value: "12mm" },
          { name: "लंबाई", value: "12 मीटर" },
        ],
        price: 685,
        priceStatus: "fixed",
        unit: "किग्रा",
        availability: "available",
      },
      {
        label: "16mm × 12 मीटर",
        sku: "JSW-TMT-16MM-12M",
        attributes: [
          { name: "साइज़", value: "16mm" },
          { name: "लंबाई", value: "12 मीटर" },
        ],
        price: 675,
        priceStatus: "fixed",
        unit: "किग्रा",
        availability: "available",
      },
      {
        label: "20mm × 12 मीटर",
        sku: "JSW-TMT-20MM-12M",
        attributes: [
          { name: "साइज़", value: "20mm" },
          { name: "लंबाई", value: "12 मीटर" },
        ],
        price: 665,
        priceStatus: "fixed",
        unit: "किग्रा",
        availability: "available",
      },
    ],
    keywords: ["सरिया", "tmt", "steel", "jsw", "500d"],
  }),
  demoRecord({
    id: "demo-prod-3",
    name: "Finolex PVC Conduit Pipe 25mm Heavy",
    slug: "pvc-conduit-25mm",
    sku: "FIN-PVC-25MM",
    brand: "Finolex",
    categoryId: "demo-cat-pvc",
    unit: "मीटर",
    price: 48,
    availability: "available",
    shortDescription: "25mm हेवी ड्यूटी PVC कंड्यूट पाइप — छिपी वायरिंग के लिए।",
    specifications: [
      { name: "व्यास", value: "25mm", group: "साइज़" },
      { name: "प्रकार", value: "कंड्यूट", group: "पाइप" },
      { name: "प्रेशर क्लास", value: "Heavy", group: "पाइप" },
    ],
    variants: [
      {
        label: "20mm",
        sku: "FIN-PVC-20MM",
        attributes: [{ name: "व्यास", value: "20mm" }],
        priceStatus: "on_request",
        unit: "मीटर",
        availability: "on_request",
      },
      {
        label: "25mm",
        sku: "FIN-PVC-25MM-V",
        attributes: [{ name: "व्यास", value: "25mm" }],
        price: 48,
        priceStatus: "fixed",
        unit: "मीटर",
        availability: "available",
      },
      {
        label: "32mm",
        sku: "FIN-PVC-32MM",
        attributes: [{ name: "व्यास", value: "32mm" }],
        priceStatus: "on_request",
        unit: "मीटर",
        availability: "on_request",
      },
    ],
    keywords: ["पाइप", "pvc", "conduit", "finolex", "25mm"],
  }),
  demoRecord({
    id: "demo-prod-4",
    name: "Kajaria Vitrified Floor Tile 600x600mm",
    slug: "vitrified-tile-600",
    sku: "KAJ-VIT-600",
    brand: "Kajaria",
    categoryId: "demo-cat-vitrified",
    unit: "वर्ग फुट",
    price: 42,
    availability: "available",
    shortDescription: "600x600mm विट्रिफाइड फ्लोर टाइल — चमकदार और टिकाऊ।",
    featured: true,
    specifications: [
      { name: "साइज़", value: "600x600mm", group: "साइज़" },
      { name: "फिनिश", value: "विट्रिफाइड", group: "फिनिश" },
      { name: "मोटाई", value: "9mm", group: "साइज़" },
    ],
    keywords: ["टाइल", "tile", "vitrified", "kajaria", "floor"],
  }),
  demoRecord({
    id: "demo-prod-5",
    name: "Havells FRLS PVC Insulated Wire 2.5 sq.mm",
    slug: "frls-pvc-wire-2.5",
    sku: "HAV-FRLS-2.5",
    brand: "Havells",
    categoryId: "demo-cat-house-wires",
    unit: "मीटर",
    price: 28,
    availability: "available",
    shortDescription: "2.5 sq.mm FRLS PVC इंसुलेटेड तार — घर की वायरिंग के लिए।",
    specifications: [
      { name: "साइज़", value: "2.5 sq.mm", group: "तार" },
      { name: "इन्सुलेशन", value: "FRLS PVC", group: "तार" },
      { name: "रंग", value: "लाल", group: "रंग" },
    ],
    variants: [
      {
        label: "1.0 sq.mm · लाल",
        sku: "HAV-FRLS-1.0-R",
        attributes: [
          { name: "साइज़", value: "1.0 sq.mm" },
          { name: "रंग", value: "लाल" },
        ],
        priceStatus: "on_request",
        unit: "मीटर",
        availability: "on_request",
      },
      {
        label: "1.5 sq.mm · लाल",
        sku: "HAV-FRLS-1.5-R",
        attributes: [
          { name: "साइज़", value: "1.5 sq.mm" },
          { name: "रंग", value: "लाल" },
        ],
        priceStatus: "on_request",
        unit: "मीटर",
        availability: "on_request",
      },
      {
        label: "2.5 sq.mm · लाल",
        sku: "HAV-FRLS-2.5-R",
        attributes: [
          { name: "साइज़", value: "2.5 sq.mm" },
          { name: "रंग", value: "लाल" },
        ],
        price: 28,
        priceStatus: "fixed",
        unit: "मीटर",
        availability: "available",
      },
      {
        label: "2.5 sq.mm · नीला",
        sku: "HAV-FRLS-2.5-B",
        attributes: [
          { name: "साइज़", value: "2.5 sq.mm" },
          { name: "रंग", value: "नीला" },
        ],
        priceStatus: "on_request",
        unit: "मीटर",
        availability: "on_request",
      },
    ],
    keywords: ["तार", "wire", "havells", "frls", "2.5"],
  }),
  demoRecord({
    id: "demo-prod-6",
    name: "Cera Wall Hung Wash Basin White",
    slug: "wall-hung-wash-basin",
    sku: "CERA-WHB-W",
    brand: "Cera",
    categoryId: "demo-cat-wash-basins",
    unit: "पीस",
    price: 2450,
    availability: "available",
    shortDescription: "वॉल हंग वॉश बेसिन, सफेद सिरेमिक — आधुनिक बाथरूम के लिए।",
    specifications: [
      { name: "प्रकार", value: "वॉल हंग", group: "बेसिन" },
      { name: "रंग", value: "सफेद", group: "रंग" },
      { name: "सामग्री", value: "सिरेमिक", group: "सामग्री" },
    ],
    keywords: ["बेसिन", "wash basin", "cera", "bathroom"],
  }),
  demoRecord({
    id: "demo-prod-7",
    name: "TATA Mild Steel Angle 50x50x6mm",
    slug: "ms-angle-50x50x6",
    sku: "TATA-MSA-50X50X6",
    brand: "TATA",
    categoryId: "demo-cat-ms-sections",
    unit: "किग्रा",
    price: 78,
    availability: "on_request",
    shortDescription: "MS एंगल 50x50x6mm — शेड, गेट और फैब्रिकेशन के लिए।",
    specifications: [
      { name: "साइज़", value: "50x50x6mm", group: "साइज़" },
      { name: "सामग्री", value: "माइल्ड स्टील", group: "स्टील" },
    ],
    keywords: ["एंगल", "angle", "ms", "tata", "steel"],
  }),
  demoRecord({
    id: "demo-prod-8",
    name: "Kota Stone Natural Polished 600x600mm",
    slug: "kota-stone-600",
    sku: "LOC-KST-600",
    brand: "Local",
    categoryId: "demo-cat-kota",
    unit: "वर्ग फुट",
    price: 38,
    availability: "available",
    shortDescription: "कोटा स्टोन नेचुरल पॉलिश 600x600mm — फर्श और सीढ़ियों के लिए।",
    featured: true,
    specifications: [
      { name: "साइज़", value: "600x600mm", group: "साइज़" },
      { name: "फिनिश", value: "नेचुरल पॉलिश", group: "फिनिश" },
      { name: "मूल स्थान", value: "कोटा, राजस्थान", group: "पत्थर" },
    ],
    keywords: ["कोटा", "kota stone", "पत्थर", "flooring"],
  }),
  demoRecord({
    id: "demo-prod-9",
    name: "ACC PPC Cement 50kg",
    slug: "acc-ppc-50kg",
    sku: "ACC-PPC-50KG",
    brand: "ACC",
    categoryId: "demo-cat-ppc",
    unit: "बोरी",
    price: 380,
    availability: "available",
    shortDescription: "50 kg बोरी, PPC ग्रेड — प्लास्टर और चिनाई के लिए।",
    specifications: [
      { name: "ग्रेड", value: "PPC", group: "सीमेंट" },
      { name: "बोरी का वज़न", value: "50 kg", group: "पैकिंग" },
    ],
    keywords: ["सीमेंट", "ppc", "acc", "plaster"],
  }),
  demoRecord({
    id: "demo-prod-10",
    name: "Ambuja OPC 43 Grade Cement",
    slug: "ambuja-opc-43",
    sku: "AMB-OPC43-50KG",
    brand: "Ambuja",
    categoryId: "demo-cat-opc-43",
    unit: "बोरी",
    price: 400,
    availability: "available",
    shortDescription: "50 kg बोरी, OPC 43 ग्रेड — सामान्य निर्माण कार्य के लिए।",
    specifications: [
      { name: "ग्रेड", value: "OPC 43", group: "सीमेंट" },
      { name: "बोरी का वज़न", value: "50 kg", group: "पैकिंग" },
    ],
    keywords: ["सीमेंट", "opc 43", "ambuja"],
  }),

  // ── Additional samples: deliberately price-on-request ──────────────────
  demoRecord({
    id: "demo-prod-11",
    name: "Jaisalmer Yellow Stone 600x600mm",
    slug: "jaisalmer-yellow-stone-600",
    sku: "LOC-JST-600",
    brand: "Local",
    categoryId: "demo-cat-jaisalmer",
    unit: "वर्ग फुट",
    availability: "on_request",
    shortDescription: "जैसलमेर का पीला प्राकृतिक पत्थर — कटिंग और फिनिश ग्राहक के हिसाब से।",
    specifications: [
      { name: "साइज़", value: "600x600mm", group: "साइज़" },
      { name: "फिनिश", value: "होन्ड", group: "फिनिश" },
      { name: "मूल स्थान", value: "जैसलमेर, राजस्थान", group: "पत्थर" },
    ],
    keywords: ["जैसलमेर", "jaisalmer", "पीला पत्थर", "stone"],
  }),
  demoRecord({
    id: "demo-prod-12",
    name: "River Sand — Fine Grade",
    slug: "river-sand-fine",
    sku: "LOC-RS-FINE",
    brand: "Local",
    categoryId: "demo-cat-river-sand",
    unit: "क्यूबिक फुट",
    availability: "on_request",
    shortDescription: "प्लास्टर और फिनिशिंग के लिए बारीक नदी की बालू।",
    specifications: [
      { name: "ग्रेड", value: "बारीक", group: "बालू" },
      { name: "स्रोत", value: "नदी", group: "बालू" },
    ],
    keywords: ["बालू", "sand", "river sand", "fine"],
  }),
  demoRecord({
    id: "demo-prod-13",
    name: "Red Clay Brick 9x4x3 inch",
    slug: "red-clay-brick",
    sku: "LOC-BRICK-RED",
    brand: "Local",
    categoryId: "demo-cat-bricks",
    unit: "पीस",
    availability: "on_request",
    shortDescription: "मिट्टी की लाल ईंट — दीवार और चिनाई के लिए।",
    specifications: [
      { name: "साइज़", value: "9x4x3 inch", group: "साइज़" },
      { name: "सामग्री", value: "मिट्टी", group: "सामग्री" },
    ],
    keywords: ["ईंट", "brick", "red brick", "eent"],
  }),
  demoRecord({
    id: "demo-prod-14",
    name: "Astral CPVC Hot Water Pipe 1 inch",
    slug: "astral-cpvc-1-inch",
    sku: "AST-CPVC-1IN",
    brand: "Astral",
    categoryId: "demo-cat-cpvc",
    unit: "मीटर",
    availability: "on_request",
    shortDescription: "गर्म पानी की लाइन के लिए 1 inch CPVC पाइप।",
    specifications: [
      { name: "व्यास", value: "1 inch", group: "साइज़" },
      { name: "सामग्री", value: "CPVC", group: "पाइप" },
      { name: "प्रेशर क्लास", value: "SDR 11", group: "पाइप" },
    ],
    keywords: ["cpvc", "पाइप", "astral", "hot water"],
  }),
  demoRecord({
    id: "demo-prod-15",
    name: "Legrand Modular Switch 6A White",
    slug: "legrand-switch-6a",
    sku: "LEG-SW-6A-W",
    brand: "Legrand",
    categoryId: "demo-cat-switches",
    unit: "पीस",
    availability: "on_request",
    shortDescription: "6A मॉड्यूलर स्विच, सफेद — घर और दुकान के लिए।",
    specifications: [
      { name: "करंट", value: "6A", group: "इलेक्ट्रिकल" },
      { name: "रंग", value: "सफेद", group: "रंग" },
      { name: "सीरीज़", value: "मॉड्यूलर", group: "इलेक्ट्रिकल" },
    ],
    keywords: ["स्विच", "switch", "legrand", "modular"],
  }),
  demoRecord({
    id: "demo-prod-16",
    name: "Philips LED Bulb 9W Cool White",
    slug: "philips-led-9w",
    sku: "PHI-LED-9W-CW",
    brand: "Philips",
    categoryId: "demo-cat-led",
    unit: "पीस",
    availability: "on_request",
    shortDescription: "9W LED बल्ब, कूल व्हाइट — कम बिजली में तेज़ रोशनी।",
    specifications: [
      { name: "वाट", value: "9W", group: "इलेक्ट्रिकल" },
      { name: "रंग का तापमान", value: "6500K", group: "लाइट" },
      { name: "बेस", value: "B22", group: "लाइट" },
    ],
    keywords: ["बल्ब", "led", "philips", "light"],
  }),
  demoRecord({
    id: "demo-prod-17",
    name: "Hex Bolt M10 x 75mm",
    slug: "hex-bolt-m10-75",
    sku: "LOC-HB-M10-75",
    brand: "Local",
    categoryId: "demo-cat-fasteners",
    unit: "पीस",
    priceStatus: "not_supplied",
    availability: "not_confirmed",
    shortDescription: "M10 x 75mm हेक्स बोल्ट — फैब्रिकेशन और फिटिंग के लिए।",
    specifications: [
      { name: "साइज़", value: "M10 x 75mm", group: "साइज़" },
      { name: "सामग्री", value: "माइल्ड स्टील", group: "सामग्री" },
    ],
    keywords: ["बोल्ट", "bolt", "hex", "fastener"],
  }),
  demoRecord({
    id: "demo-prod-18",
    name: "Cera Wall Hung Toilet White",
    slug: "cera-wall-hung-toilet",
    sku: "CERA-WHT-W",
    brand: "Cera",
    categoryId: "demo-cat-toilets",
    unit: "पीस",
    availability: "on_request",
    shortDescription: "वॉल हंग टॉयलेट, सफेद — आधुनिक बाथरूम के लिए।",
    specifications: [
      { name: "प्रकार", value: "वॉल हंग", group: "टॉयलेट" },
      { name: "फ्लश", value: "डुअल फ्लश", group: "टॉयलेट" },
      { name: "रंग", value: "सफेद", group: "रंग" },
    ],
    keywords: ["टॉयलेट", "toilet", "cera", "bathroom"],
  }),
  demoRecord({
    id: "demo-prod-19",
    name: "Havells Ceiling Fan 1200mm Brown",
    slug: "havells-ceiling-fan-1200",
    sku: "HAV-CF-1200-BR",
    brand: "Havells",
    categoryId: "demo-cat-fans",
    unit: "पीस",
    availability: "on_request",
    shortDescription: "1200mm सीलिंग फैन, ब्राउन — हॉल और बड़े कमरों के लिए।",
    specifications: [
      { name: "स्वीप", value: "1200mm", group: "साइज़" },
      { name: "रंग", value: "ब्राउन", group: "रंग" },
    ],
    keywords: ["पंखा", "fan", "ceiling fan", "havells"],
  }),
  demoRecord({
    id: "demo-prod-20",
    name: "Birla White Cement 40kg",
    slug: "birla-white-cement-40kg",
    sku: "BW-WC-40KG",
    brand: "Birla White",
    categoryId: "demo-cat-white-cement",
    unit: "बोरी",
    availability: "on_request",
    shortDescription: "40 kg व्हाइट सीमेंट — फिनिशिंग और टाइल जोड़ने के लिए।",
    specifications: [
      { name: "वज़न", value: "40 kg", group: "पैकिंग" },
      { name: "प्रकार", value: "व्हाइट सीमेंट", group: "सीमेंट" },
    ],
    keywords: ["व्हाइट सीमेंट", "white cement", "birla"],
  }),
  demoRecord({
    id: "demo-prod-21",
    name: "Stone Dust — Plaster Grade",
    slug: "stone-dust-plaster",
    sku: "LOC-SD-PLASTER",
    brand: "Local",
    categoryId: "demo-cat-stone-dust",
    unit: "ट्रिप",
    availability: "on_request",
    shortDescription: "प्लास्टर और फ्लोर बेस के लिए स्टोन डस्ट।",
    specifications: [
      { name: "प्रकार", value: "स्टोन डस्ट", group: "एग्रीगेट" },
      { name: "उपयोग", value: "प्लास्टर", group: "एग्रीगेट" },
    ],
    keywords: ["स्टोन डस्ट", "stone dust", "plaster"],
  }),
  demoRecord({
    id: "demo-prod-22",
    name: "Stainless Steel Door Hinge 4 inch",
    slug: "ss-door-hinge-4-inch",
    sku: "LOC-SSH-4IN",
    brand: "Local",
    categoryId: "demo-cat-door-fittings",
    unit: "जोड़ी",
    priceStatus: "not_supplied",
    availability: "not_confirmed",
    shortDescription: "4 inch SS दरवाज़ा हिंज — भारी दरवाज़ों के लिए।",
    specifications: [
      { name: "साइज़", value: "4 inch", group: "साइज़" },
      { name: "सामग्री", value: "स्टेनलेस स्टील", group: "सामग्री" },
    ],
    keywords: ["हिंज", "hinge", "door", "ss"],
  }),
  demoRecord({
    id: "demo-prod-23",
    name: "Finolex PVC Pipe 4 inch",
    slug: "finolex-pvc-4-inch",
    sku: "FIN-PVC-4IN",
    brand: "Finolex",
    categoryId: "demo-cat-pvc",
    unit: "मीटर",
    availability: "on_request",
    shortDescription: "4 inch PVC ड्रेनेज पाइप — सीवर और वेस्ट लाइन के लिए।",
    specifications: [
      { name: "व्यास", value: "4 inch", group: "साइज़" },
      { name: "प्रकार", value: "ड्रेनेज", group: "पाइप" },
    ],
    keywords: ["पाइप", "pvc", "drainage", "4 inch"],
  }),
  demoRecord({
    id: "demo-prod-24",
    name: "Polycab Copper Wire 1.5 sq.mm",
    slug: "polycab-copper-wire-1.5",
    sku: "POL-CU-1.5",
    brand: "Polycab",
    categoryId: "demo-cat-house-wires",
    unit: "मीटर",
    availability: "on_request",
    shortDescription: "1.5 sq.mm कॉपर तार — घर की वायरिंग के लिए।",
    specifications: [
      { name: "साइज़", value: "1.5 sq.mm", group: "तार" },
      { name: "कंडक्टर", value: "कॉपर", group: "तार" },
    ],
    keywords: ["तार", "wire", "copper", "polycab"],
  }),
  demoRecord({
    id: "demo-prod-25",
    name: "Somany Ceramic Wall Tile 300x600mm",
    slug: "somany-ceramic-wall-tile",
    sku: "SOM-CER-300X600",
    brand: "Somany",
    categoryId: "demo-cat-ceramic",
    unit: "वर्ग फुट",
    availability: "on_request",
    shortDescription: "300x600mm सेरामिक वॉल टाइल — ग्लॉसी फिनिश।",
    specifications: [
      { name: "साइज़", value: "300x600mm", group: "साइज़" },
      { name: "फिनिश", value: "ग्लॉसी", group: "फिनिश" },
    ],
    keywords: ["टाइल", "ceramic", "somany", "wall tile"],
  }),
];

export const demoProducts: ProductCardData[] = records.map((record) => record.card);

export const demoProductsDetail: Record<string, ProductDetail> = Object.fromEntries(
  records.map((record) => [record.card._id, record.detail]),
);

export function demoProductBySlug(slug: string): ProductDetail | null {
  const product = demoProducts.find((item) => item.slug === slug);
  return product ? demoProductsDetail[product._id] ?? null : null;
}

export function demoProductsByCategory(
  categoryId: string | string[],
  excludeSlug?: string,
): ProductCardData[] {
  const ids = new Set(Array.isArray(categoryId) ? categoryId : [categoryId]);
  return demoProducts.filter(
    (product) =>
      Boolean(product.category?._id && ids.has(product.category._id)) &&
      product.slug !== excludeSlug,
  );
}

function productHaystack(product: ProductCardData): string {
  const detail = demoProductsDetail[product._id];
  const parts: string[] = [
    product.name,
    product.sku,
    product.brand?.name ?? "",
    product.category?.name ?? "",
    product.shortDescription ?? "",
  ];

  for (const spec of detail?.specifications ?? []) {
    parts.push(spec.name, spec.value);
  }
  for (const keyword of detail?.keywords ?? []) parts.push(keyword);
  for (const variant of detail?.variants ?? []) {
    parts.push(variant.label, variant.sku ?? "");
    for (const attribute of variant.attributes) parts.push(attribute.name, attribute.value);
  }

  return parts.filter(Boolean).join(" ").toLowerCase();
}

function matchesSpecs(
  product: ProductCardData,
  specs: Array<{ name: string; value: string }>,
): boolean {
  if (specs.length === 0) return true;
  const detail = demoProductsDetail[product._id];
  const pairs = [
    ...(detail?.specifications ?? []).map((spec) => [spec.name, spec.value] as const),
    ...(detail?.variants ?? []).flatMap((variant) =>
      variant.attributes.map((attribute) => [attribute.name, attribute.value] as const),
    ),
  ];
  return specs.every((spec) =>
    pairs.some(([name, value]) => name === spec.name && value === spec.value),
  );
}

function compareProducts(a: ProductCardData, b: ProductCardData, sort: SortKey): number {
  switch (sort) {
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "price-asc": {
      const aPrice = a.price ?? Number.POSITIVE_INFINITY;
      const bPrice = b.price ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice || a.name.localeCompare(b.name);
    }
    case "price-desc": {
      const aPrice = a.price ?? -1;
      const bPrice = b.price ?? -1;
      return bPrice - aPrice || a.name.localeCompare(b.name);
    }
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "recommended":
    default:
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name);
  }
}

function filterDemoProducts(input: CatalogQueryInput, options: {
  ignoreBrand?: boolean;
  ignoreAvailability?: boolean;
  ignoreSpecs?: boolean;
} = {}): ProductCardData[] {
  const needle = input.q?.trim().toLowerCase() ?? "";
  const categoryIds = input.categoryIds?.length ? new Set(input.categoryIds) : null;

  return demoProducts.filter((product) => {
    if (categoryIds && (!product.category?._id || !categoryIds.has(product.category._id))) {
      return false;
    }
    if (needle && !fuzzyIncludes(productHaystack(product), needle)) return false;
    if (!options.ignoreBrand && input.brandSlugs?.length) {
      if (!product.brand || !input.brandSlugs.includes(product.brand.slug)) return false;
    }
    if (!options.ignoreAvailability && input.availability?.length) {
      if (!input.availability.includes(product.availability)) return false;
    }
    if (typeof input.minPrice === "number") {
      if (typeof product.price !== "number" || product.price < input.minPrice) return false;
    }
    if (typeof input.maxPrice === "number") {
      if (typeof product.price !== "number" || product.price > input.maxPrice) return false;
    }
    if (!options.ignoreSpecs && input.specs?.length && !matchesSpecs(product, input.specs)) {
      return false;
    }
    return true;
  });
}

export function demoProductList(input: CatalogQueryInput): {
  items: ProductCardData[];
  total: number;
} {
  const matches = filterDemoProducts(input).sort((a, b) =>
    compareProducts(a, b, input.sort),
  );
  const start = (input.page - 1) * input.pageSize;
  return {
    items: matches.slice(start, start + input.pageSize),
    total: matches.length,
  };
}

export function demoFacets(input: CatalogQueryInput): Facets {
  const brandRows = demoBrands
    .map((brand) => {
      const count = filterDemoProducts(input, { ignoreBrand: true }).filter(
        (product) => product.brand?.slug === brand.slug,
      ).length;
      return { name: brand.name, slug: brand.slug, count };
    })
    .filter((row) => row.count > 0);

  const availabilityRows = filterDemoProducts(input, { ignoreAvailability: true });
  const availabilityCounts: Partial<Record<Availability, number>> = {
    available: availabilityRows.filter((product) => product.availability === "available").length,
    on_request: availabilityRows.filter((product) => product.availability === "on_request").length,
    unavailable: availabilityRows.filter((product) => product.availability === "unavailable").length,
    not_confirmed: availabilityRows.filter((product) => product.availability === "not_confirmed").length,
  };

  const specRows: FacetProductRow[] = filterDemoProducts(input, { ignoreSpecs: true }).map(
    (product) => {
      const detail = demoProductsDetail[product._id];
      const pairs = [
        ...(detail?.specifications ?? []).map((spec) => ({ name: spec.name, value: spec.value })),
        ...(detail?.variants ?? []).flatMap((variant) =>
          variant.attributes.map((attribute) => ({
            name: attribute.name,
            value: attribute.value,
          })),
        ),
      ];
      return { brand: product.brand, availability: product.availability, pairs };
    },
  );

  return assembleFacets(brandRows, availabilityCounts, specRows);
}

export function demoBrandBySlug(slug: string): Brand | null {
  return demoBrands.find((brand) => brand.slug === slug) ?? null;
}

export function demoTopLevelCategories() {
  return demoCategories.filter((cat) => !cat.parentId);
}

export function demoAllCategories(): Category[] {
  return demoCategories;
}

export function demoAllBrands(): Brand[] {
  return demoBrands;
}

export function demoCategoryArt(categorySlug: string | null | undefined): string | null {
  if (!categorySlug) return null;
  const known = new Set([
    "cement-concrete",
    "sand-aggregates",
    "steel-tmt",
    "stone-marble",
    "tiles-flooring",
    "sanitaryware",
    "lighting",
    "hardware-tools",
    "wires-electrical",
    "pipes-plumbing",
  ]);
  return known.has(categorySlug) ? `/material/${categorySlug}.svg` : null;
}

export const demoCategoryArtSlugs = [
  "cement-concrete",
  "sand-aggregates",
  "steel-tmt",
  "stone-marble",
  "tiles-flooring",
  "sanitaryware",
  "lighting",
  "hardware-tools",
  "wires-electrical",
  "pipes-plumbing",
] as const;

export type { VariantAttribute };
