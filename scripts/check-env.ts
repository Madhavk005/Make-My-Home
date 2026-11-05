import { config as loadDotenv } from "dotenv";

loadDotenv({ path: [".env.local", ".env"] });

const errors: string[] = [];
const warnings: string[] = [];
const production =
  process.env.VERCEL_ENV === "production" || process.argv.includes("--production");

const required = [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET],
  ["NEXT_PUBLIC_SANITY_PROJECT_ID", process.env.NEXT_PUBLIC_SANITY_PROJECT_ID],
  ["NEXT_PUBLIC_SANITY_DATASET", process.env.NEXT_PUBLIC_SANITY_DATASET],
];

for (const [name, value] of required) {
  if (!value?.trim()) errors.push(name + " is required.");
}

if (!process.env.NEXT_PUBLIC_SITE_URL?.trim() && !process.env.VERCEL_URL?.trim()) {
  errors.push("Set NEXT_PUBLIC_SITE_URL or deploy on Vercel with VERCEL_URL available.");
}

if (production) {
  const siteValue =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "");
  if (siteValue) {
    try {
      const site = new URL(siteValue);
      if (site.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(site.hostname)) {
        errors.push("Production site origin must be a public HTTPS URL.");
      }
    } catch {
      errors.push("Production site origin must be a valid absolute URL.");
    }
  }

  if ((process.env.BETTER_AUTH_SECRET?.trim().length ?? 0) < 32) {
    errors.push("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    try {
      const database = new URL(databaseUrl);
      if (!["postgres:", "postgresql:"].includes(database.protocol)) {
        errors.push("DATABASE_URL must use the PostgreSQL protocol.");
      }
      if (["localhost", "127.0.0.1", "host"].includes(database.hostname)) {
        errors.push("Production DATABASE_URL must point to a hosted PostgreSQL database.");
      }
    } catch {
      errors.push("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }
  }

  if (process.env.ALLOW_PUBLIC_SIGNUP === "true") {
    errors.push("Public sign-up must remain disabled for production.");
  }
  if (process.env.ALLOW_DEMO_DATA === "true") {
    errors.push("Demo data cannot be enabled in production.");
  }
  if (!process.env.SANITY_REVALIDATE_SECRET?.trim()) {
    warnings.push(
      "SANITY_REVALIDATE_SECRET is empty. Published changes will still appear after the cache window, but the Sanity webhook cannot refresh them instantly.",
    );
  }
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

if (adminEmails.length === 0) {
  errors.push("Set at least one ADMIN_EMAILS entry for the admin allowlist.");
} else if (
  !adminEmails.some((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
) {
  errors.push("ADMIN_EMAILS must contain at least one valid email address.");
}

if (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()) {
  warnings.push(
    "NEXT_PUBLIC_WHATSAPP_NUMBER is no longer used. Set the WhatsApp number in Sanity Studio → Site settings instead.",
  );
}

if (warnings.length) {
  console.warn("Environment warnings:");
  for (const warning of warnings) console.warn(" - " + warning);
}

if (errors.length) {
  console.error("Environment check failed:");
  for (const error of errors) console.error(" - " + error);
  process.exitCode = 1;
} else {
  console.log("Environment variables are present and valid for this environment.");
  console.log("Before launch, verify real business contact details in Sanity Site settings.");
}
