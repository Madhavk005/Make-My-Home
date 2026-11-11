import "server-only";
import { createClient, type SanityClient } from "@sanity/client";

/**
 * Server-only write client.
 *
 * The token must never reach the browser. All category mutations go through
 * server actions or route handlers that have already checked the admin session.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";
const writeToken = process.env.SANITY_API_WRITE_TOKEN?.trim();

export const isSanityWriteConfigured = Boolean(projectId && dataset && writeToken);

let cached: SanityClient | null = null;

export function getSanityWriteClient(): SanityClient {
  if (!isSanityWriteConfigured) {
    throw new Error(
      "Sanity writes are not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN on the server.",
    );
  }

  if (!cached) {
    cached = createClient({
      projectId: projectId as string,
      dataset,
      apiVersion,
      useCdn: false,
      perspective: "published",
      token: writeToken,
    });
  }

  return cached;
}
