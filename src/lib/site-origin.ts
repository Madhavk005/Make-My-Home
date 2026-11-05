const LOCAL_SITE_ORIGIN = "http://localhost:3000";

export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const deploymentHost = process.env.VERCEL_URL?.trim();
  const candidate =
    configured || (deploymentHost ? "https://" + deploymentHost : LOCAL_SITE_ORIGIN);

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP or HTTPS URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must not contain credentials.");
  }
  if (
    (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") &&
    url.protocol !== "https:"
  ) {
    throw new Error("Deployed site origins must use HTTPS.");
  }

  return url.origin;
}
