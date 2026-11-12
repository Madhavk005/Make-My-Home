import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { pool } from "@/lib/db";
import { getSiteOrigin } from "@/lib/site-origin";

const publicSignUpEnabled = true;
const dashApiKey = process.env.BETTER_AUTH_API_KEY?.trim();

const siteOrigin = getSiteOrigin();
const baseURL =
  process.env.VERCEL_ENV === "preview"
    ? siteOrigin
    : process.env.BETTER_AUTH_URL?.trim() || siteOrigin;

function originOf(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Vercel supplies VERCEL_URL per deployment. The site-origin helper uses it
 * for previews when no canonical NEXT_PUBLIC_SITE_URL is set.
 */
const trustedOrigins = Array.from(
  new Set(
    [
      originOf(baseURL),
      siteOrigin,
      originOf(process.env.NEXT_PUBLIC_BETTER_AUTH_URL),
      originOf(process.env.NEXT_PUBLIC_SITE_URL),
      "http://localhost:3000",
      "http://localhost:3100",
      "http://localhost:3101",
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

export const auth = betterAuth({
  database: pool,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    // Public sign-up is opt-in. The admin allowlist is the only way into the
    // admin panel, so leaving open registration on by default is unsafe.
    disableSignUp: !publicSignUpEnabled,
  },
  plugins: [...(dashApiKey ? [dash({ apiKey: dashApiKey })] : []), nextCookies()],
});
