import "server-only";
import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";
const readToken = process.env.SANITY_API_READ_TOKEN?.trim();

export const isSanityConfigured = Boolean(projectId && dataset);
export const isDemoDataEnabled =
  !isSanityConfigured &&
  process.env.ALLOW_DEMO_DATA === "true" &&
  (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview");

export const sanityClient: SanityClient | null = isSanityConfigured
  ? createClient({
      projectId: projectId as string,
      dataset,
      apiVersion,
      // Next.js caches these requests by tag. Disabling the Sanity CDN keeps
      // webhook revalidation immediate instead of waiting for edge propagation.
      useCdn: false,
      perspective: "published",
      token: readToken || undefined,
    })
  : null;

type SanityFetchOptions = {
  query: string;
  params?: Record<string, unknown>;
  tags?: string[];
  revalidate?: number;
};

/**
 * Server-only Sanity query helper.
 *
 * Returns null when the CMS is not configured so the storefront can render an
 * honest setup state instead of crashing during a build or preview.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
}: SanityFetchOptions): Promise<T | null> {
  if (!sanityClient) return null;

  return sanityClient.fetch<T>(query, params, {
    next: { revalidate, tags },
  });
}
