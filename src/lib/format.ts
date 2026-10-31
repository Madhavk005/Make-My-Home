import {
  DEFAULT_LOCALE,
  unitLabel,
  type Locale,
} from "./i18n";
import type { Availability, PriceStatus } from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return inr.format(value);
}

export function formatPriceWithUnit(
  value: number,
  unit: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return `${formatINR(value)} / ${unitLabel(unit, locale)}`;
}

export type PriceDisplay = {
  primary: string;
  suffix?: string;
  note?: string;
  isFrom: boolean;
  isNumeric: boolean;
};

export function priceDisplay(
  input: {
    price?: number | null;
    priceStatus?: PriceStatus | null;
    unit: string;
    fromPrice?: number | null;
    variantCount?: number | null;
  },
  locale: Locale = DEFAULT_LOCALE,
): PriceDisplay {
  const status = input.priceStatus ?? "not_supplied";
  const hasPrice = typeof input.price === "number" && input.price > 0;
  const hasFromPrice = typeof input.fromPrice === "number" && input.fromPrice > 0;
  const unit = unitLabel(input.unit, locale);

  if (status === "fixed" && hasPrice) {
    return {
      primary: formatINR(input.price as number),
      suffix: `/ ${unit}`,
      isFrom: false,
      isNumeric: true,
    };
  }

  if (status === "fixed" && hasFromPrice) {
    return {
      primary:
        locale === "hi"
          ? `${formatINR(input.fromPrice as number)} से`
          : `From ${formatINR(input.fromPrice as number)}`,
      suffix: `/ ${unit}`,
      isFrom: true,
      isNumeric: true,
    };
  }

  if (status === "on_request") {
    return {
      primary: locale === "hi" ? "कीमत पूछें" : "Price on request",
      note: locale === "hi" ? "दुकानदार से कीमत पूछें।" : "Ask the shop for the price.",
      isFrom: false,
      isNumeric: false,
    };
  }

  return {
    primary: locale === "hi" ? "दुकान से कीमत पता करें" : "Ask the shop for the price",
    note:
      locale === "hi"
        ? "अभी कीमत नहीं दी गई है।"
        : "The price has not been supplied yet.",
    isFrom: false,
    isNumeric: false,
  };
}

export function availabilityMeta(
  availability: Availability | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): {
  label: string;
  dotClass: string;
  badgeClass: string;
  /** True only for an availability the business has actually confirmed. */
  confirmed: boolean;
} {
  switch (availability) {
    case "available":
      return {
        label: locale === "hi" ? "उपलब्ध" : "Available",
        dotClass: "bg-emerald-600",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
        confirmed: true,
      };
    case "on_request":
      return {
        label: locale === "hi" ? "उपलब्धता पूछें" : "Ask about availability",
        dotClass: "bg-amber-500",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-950",
        confirmed: false,
      };
    case "unavailable":
      return {
        label: locale === "hi" ? "अभी उपलब्ध नहीं" : "Currently unavailable",
        dotClass: "bg-stone-400",
        badgeClass: "border-stone-300 bg-stone-100 text-stone-700",
        confirmed: true,
      };
    case "not_confirmed":
    default:
      return {
        label: locale === "hi" ? "उपलब्धता पुष्टि नहीं हुई" : "Availability not confirmed",
        dotClass: "bg-stone-400",
        badgeClass: "border-stone-300 bg-white text-stone-600",
        confirmed: false,
      };
  }
}

export function priceStatusLabel(
  status: PriceStatus,
  locale: Locale = DEFAULT_LOCALE,
): string {
  switch (status) {
    case "fixed":
      return locale === "hi" ? "तय कीमत" : "Fixed price";
    case "on_request":
      return locale === "hi" ? "कीमत पूछें" : "Price on request";
    case "not_supplied":
    default:
      return locale === "hi" ? "कीमत नहीं दी गई" : "Price not supplied";
  }
}

export function variantPrice(
  variant: { price?: number | null; priceStatus?: PriceStatus | null; unit?: string | null },
  product: { price?: number | null; priceStatus: PriceStatus; unit: string },
) {
  return {
    price: variant.price ?? product.price,
    priceStatus: variant.priceStatus ?? product.priceStatus,
    unit: variant.unit || product.unit,
  };
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/**
 * A compact fallback mark for brands without a supplied logo. Multi-word names
 * use two initials ("Birla White" → "BW"); single words use one letter so a
 * two-letter slice never produces odd marks like "UI" for "UltraTech".
 */
export function brandMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return (words[0][0] ?? "?").toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
}
