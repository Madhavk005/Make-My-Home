import type { MetadataRoute } from "next";
import { getBrandsWithCounts, getCatalogue } from "@/lib/catalogue";
import { categoryHref, flattenCategoryTree } from "@/lib/categories";
import { isSanityConfigured, sanityFetch } from "@/lib/sanity";
import { getSiteOrigin } from "@/lib/site-origin";

type ProductSitemapEntry = {
  slug: string;
  updatedAt?: string | null;
};

const siteOrigin = getSiteOrigin();

function absoluteUrl(path: string): string {
  return new URL(path, siteOrigin).toString();
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/brands"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/calculator"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/categories"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.6 },
  ];

  // Do not put the labelled local demo catalogue into search engines.
  if (!isSanityConfigured) return staticEntries;

  const [catalogue, brands, products] = await Promise.all([
    getCatalogue(),
    getBrandsWithCounts(),
    sanityFetch<ProductSitemapEntry[]>({
      query: `*[_type == "product" && defined(slug.current) && coalesce(isDemo, false) == false]
        | order(slug.current asc){ "slug": slug.current, "updatedAt": _updatedAt }`,
      tags: ["products"],
      revalidate: 3600,
    }),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = flattenCategoryTree(catalogue.tree).map(
    (category) => ({
      url: absoluteUrl(categoryHref(category.path)),
      changeFrequency: "weekly",
      priority: category.level === "primary" ? 0.7 : category.level === "secondary" ? 0.6 : 0.5,
      ...(category.updatedAt ? { lastModified: new Date(category.updatedAt) } : {}),
    }),
  );

  const brandEntries: MetadataRoute.Sitemap = brands
    .filter((brand) => (brand.count ?? 0) > 0)
    .map((brand) => ({
      url: absoluteUrl(`/brands/${encodeURIComponent(brand.slug)}`),
      changeFrequency: "weekly",
    }));

  const productEntries: MetadataRoute.Sitemap = (products ?? [])
    .filter((product) => Boolean(product.slug))
    .map((product) => ({
      url: absoluteUrl(`/product/${encodeURIComponent(product.slug)}`),
      changeFrequency: "weekly",
      ...(product.updatedAt ? { lastModified: new Date(product.updatedAt) } : {}),
    }));

  return [...staticEntries, ...categoryEntries, ...brandEntries, ...productEntries];
}
