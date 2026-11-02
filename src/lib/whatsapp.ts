import { DEFAULT_LOCALE, attributeLabel, translate, unitLabel, type Locale } from "./i18n";
import type { Availability, EnquiryItem } from "./types";

const AVAILABILITY_TEXT: Record<Availability, { hi: string; en: string }> = {
  available: { hi: "उपलब्ध", en: "Available" },
  on_request: { hi: "उपलब्धता पूछें", en: "Availability on request" },
  unavailable: { hi: "अभी उपलब्ध नहीं", en: "Currently unavailable" },
  not_confirmed: { hi: "उपलब्धता पुष्टि नहीं हुई", en: "Availability not confirmed" },
};

export function normalizeWhatsAppNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  // wa.me needs a full international number (country code + number). Strip an
  // international "00" prefix if present.
  const international = digits.startsWith("00") ? digits.slice(2) : digits;
  // Require a country code: 11-15 digits total (e.g. India 91 + 10 digits).
  if (international.length < 11 || international.length > 15) return null;
  return international;
}

export function buildEnquiryMessage(
  items: EnquiryItem[],
  options: {
    businessName?: string | null;
    priceNote?: string | null;
    locale?: Locale;
    customerNote?: string | null;
    reference?: string | null;
    customerName?: string | null;
    customerMobile?: string | null;
    deliveryLocation?: string | null;
  } = {},
): string {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const businessName = options.businessName?.trim() || "Make My Home";
  const hasIndicativePrice = items.some(
    (item) => item.priceStatus === "fixed" && typeof item.price === "number" && item.price > 0,
  );

  if (locale === "hi") {
    return buildHindiMessage(
      items,
      businessName,
      options.priceNote ?? null,
      hasIndicativePrice,
      options.customerNote ?? null,
      options.reference ?? null,
      options.customerName ?? null,
      options.customerMobile ?? null,
      options.deliveryLocation ?? null,
    );
  }

  const lines: string[] = [
    `Hello ${businessName},`,
    "",
  ];

  if (options.reference) lines.push(`Enquiry reference: ${options.reference}`);
  if (options.customerName) lines.push(`Customer: ${options.customerName}`);
  if (options.customerMobile) lines.push(`Mobile: ${options.customerMobile}`);
  if (options.deliveryLocation) lines.push(`Delivery location: ${options.deliveryLocation}`);
  if (options.reference || options.customerName || options.customerMobile || options.deliveryLocation) lines.push("");

  lines.push(`I would like to enquire about the following ${items.length === 1 ? "item" : "items"}:`);
  lines.push("");

  items.forEach((item, index) => {
    const attributes = (item.attributes ?? [])
      .filter((attribute) => attribute.name && attribute.value)
      .map((attribute) => `${attribute.name}: ${attribute.value}`)
      .join("; ");

    lines.push(`${index + 1}. ${item.name}`);
    if (item.brand) lines.push(`   Brand: ${item.brand}`);
    if (item.sku) lines.push(`   SKU: ${item.sku}`);
    if (item.variantLabel) lines.push(`   Variant: ${item.variantLabel}`);
    if (attributes) lines.push(`   Attributes: ${attributes}`);
    lines.push(`   Quantity: ${item.quantity} ${unitLabel(item.unit, locale)}`);

    if (item.priceStatus === "fixed" && typeof item.price === "number" && item.price > 0) {
      lines.push(`   Listed price: ${formatMessagePrice(item.price)} per ${item.unit} (indicative)`);
    } else if (item.priceStatus === "on_request") {
      lines.push("   Price: On request");
    } else {
      lines.push("   Price: Not yet supplied");
    }

    lines.push(`   Availability: ${AVAILABILITY_TEXT[item.availability]?.en ?? "Not confirmed"}`);
    if (item.notes) lines.push(`   Notes: ${item.notes}`);
    lines.push("");
  });

  if (hasIndicativePrice) {
    lines.push(
      options.priceNote?.trim() ||
        "Prices shown are indicative and subject to confirmation.",
    );
    lines.push("");
  }

  if (options.customerNote?.trim()) {
    lines.push(`Customer note: ${options.customerNote.trim()}`);
    lines.push("");
  }

  lines.push("Please confirm the current rate, availability and delivery.");
  lines.push("");
  lines.push("Thank you.");

  return lines.join("\n");
}

function buildHindiMessage(
  items: EnquiryItem[],
  businessName: string,
  priceNote: string | null,
  hasIndicativePrice: boolean,
  customerNote: string | null = null,
  reference: string | null = null,
  customerName: string | null = null,
  customerMobile: string | null = null,
  deliveryLocation: string | null = null,
): string {
  const lines: string[] = [
    translate("hi", "whatsappMessageIntro", { business: businessName }),
    "",
  ];

  if (reference) lines.push(`पूछताछ संदर्भ: ${reference}`);
  if (customerName) lines.push(`ग्राहक: ${customerName}`);
  if (customerMobile) lines.push(`मोबाइल: ${customerMobile}`);
  if (deliveryLocation) lines.push(`डिलीवरी स्थान: ${deliveryLocation}`);
  if (reference || customerName || customerMobile || deliveryLocation) lines.push("");

  items.forEach((item, index) => {
    const attributes = (item.attributes ?? [])
      .filter((attribute) => attribute.name && attribute.value)
      .map((attribute) => `${attributeLabel(attribute.name, "hi")}: ${attribute.value}`)
      .join("; ");

    lines.push(`${index + 1}. ${item.name}`);
    if (item.brand) lines.push(`   ब्रांड: ${item.brand}`);
    if (item.sku) lines.push(`   कोड: ${item.sku}`);
    if (item.variantLabel) lines.push(`   विकल्प: ${item.variantLabel}`);
    if (attributes) lines.push(`   जानकारी: ${attributes}`);
    lines.push(`   मात्रा: ${item.quantity} ${unitLabel(item.unit, "hi")}`);

    if (item.priceStatus === "fixed" && typeof item.price === "number" && item.price > 0) {
      lines.push(
        `   कीमत: ${formatMessagePrice(item.price)} प्रति ${unitLabel(item.unit, "hi")} (अनुमानित)`,
      );
    } else if (item.priceStatus === "on_request") {
      lines.push("   कीमत: दुकानदार से पूछें");
    } else {
      lines.push("   कीमत: अभी नहीं दी गई");
    }

    lines.push(
      `   उपलब्धता: ${AVAILABILITY_TEXT[item.availability]?.hi ?? "पुष्टि नहीं हुई"}`,
    );
    if (item.notes) lines.push(`   नोट: ${item.notes}`);
    lines.push("");
  });

  if (hasIndicativePrice) {
    lines.push(
      priceNote?.trim() || "ऊपर दी कीमत सिर्फ़ अनुमान है। पक्की कीमत दुकानदार बताएगा।",
    );
    lines.push("");
  }

  if (customerNote?.trim()) {
    lines.push(`ग्राहक नोट: ${customerNote.trim()}`);
    lines.push("");
  }

  lines.push(translate("hi", "whatsappMessageOutro"));

  return lines.join("\n");
}

function formatMessagePrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function buildWhatsAppUrl(
  number: string | null | undefined,
  message: string,
): string | null {
  const digits = normalizeWhatsAppNumber(number);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
