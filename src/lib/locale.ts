import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, localeFromValue, type Locale } from "./i18n";

/**
 * Reads the customer's language choice from the cookie set by the language
 * switch. Hindi is the default for the village/small-town audience.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  return localeFromValue(store.get(LOCALE_COOKIE)?.value);
});
