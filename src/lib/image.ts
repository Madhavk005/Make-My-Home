import "server-only";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImage } from "./types";
import { sanityClient } from "./sanity";

type ImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

/**
 * Builds a CDN URL for a Sanity image. Returns null when the CMS is not
 * configured or the image has no uploaded asset.
 */
export function imageUrl(image: SanityImage | null | undefined, options: ImageOptions = {}): string | null {
  if (!sanityClient || !image?.asset?._ref) return null;

  let builder = imageUrlBuilder(sanityClient).image(image).auto("format").quality(options.quality ?? 80);

  if (options.width) builder = builder.width(options.width);
  if (options.height) builder = builder.height(options.height);

  return builder.url();
}
