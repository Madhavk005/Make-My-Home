import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";

const siteOrigin = getSiteOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/admin",
        "/api",
        "/compare",
        "/enquiry",
        "/enquiry-tracker",
        "/sign-in",
        "/sign-up",
        "/studio",
      ],
    },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
