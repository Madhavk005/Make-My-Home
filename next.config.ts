import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js and Sanity Studio both use inline/eval scripts. The policy still
  // restricts which origins can be loaded.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.sanity.io https://core.sanity-cdn.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://cdn.sanity.io https://core.sanity-cdn.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.sanity.io https://*.sanity-cdn.com",
  "font-src 'self' data: https://design-system-static.sanity.io",
  "connect-src 'self' https://sanity-cdn.com https://*.api.sanity.io https://*.sanity.io https://*.sanity-cdn.com https://*.google-analytics.com https://www.googletagmanager.com ws: wss:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://*.sanity.io https://*.sanity-cdn.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
