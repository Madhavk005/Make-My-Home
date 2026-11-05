import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";

/**
 * Use the current browser origin by default. Hard-coding localhost here breaks
 * authentication on every preview/production domain that is not port 3000.
 * Set NEXT_PUBLIC_BETTER_AUTH_URL only when auth is served from a different
 * origin than the storefront.
 */
const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim() ||
  (typeof window !== "undefined" ? window.location.origin : undefined) ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [dashClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
