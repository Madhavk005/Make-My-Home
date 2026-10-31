import type { Locale } from "./i18n";
import type { SiteSettings } from "./types";

/**
 * Storefront copy that is written by the business rather than the UI dictionary.
 * Each field can have an optional English version; Hindi is the source of truth
 * and the fallback when no English copy has been supplied.
 */
export type LocalizedSettingKey =
  | "tagline"
  | "address"
  | "serviceArea"
  | "openingHours"
  | "announcement"
  | "priceNote"
  | "footerNote";

export function localizedSetting(
  settings: SiteSettings | null | undefined,
  key: LocalizedSettingKey,
  locale: Locale,
): string | null {
  const hindi = settings?.[key]?.trim();
  if (locale !== "en") return hindi || null;

  const english = settings?.[`${key}En`]?.trim();
  return english || hindi || null;
}
