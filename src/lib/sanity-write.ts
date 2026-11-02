import "server-only";
import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2025-01-01";
const writeToken = process.env.SANITY_API_WRITE_TOKEN?.trim();

export const isSanityWriteConfigured = Boolean(projectId && dataset && writeToken);

export const sanityWriteClient: SanityClient | null = isSanityWriteConfigured
  ? createClient({
      projectId: projectId as string,
      dataset,
      apiVersion,
      token: writeToken,
      useCdn: false,
    })
  : null;