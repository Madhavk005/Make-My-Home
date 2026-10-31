import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const TAG_BY_TYPE: Record<string, string[]> = {
  product: ["products"],
  category: ["categories", "products"],
  brand: ["brands", "products"],
  siteSettings: ["site-settings"],
};

const ALL_TAGS = ["products", "categories", "brands", "site-settings"];

/**
 * Sanity webhook target.
 *
 * Configure the Sanity webhook to POST here with the same secret as
 * SANITY_REVALIDATE_SECRET, either as a query parameter (?secret=…) or the
 * x-revalidate-secret header. Without a configured secret this route stays
 * closed rather than accepting anonymous revalidation requests.
 */
export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { message: "Revalidation is not configured (SANITY_REVALIDATE_SECRET is empty)." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-revalidate-secret")?.trim() || url.searchParams.get("secret")?.trim();

  if (provided !== secret) {
    return NextResponse.json({ message: "Invalid revalidation secret." }, { status: 401 });
  }

  let type: string | null = null;
  try {
    const body = (await request.json()) as { _type?: unknown };
    type = typeof body?._type === "string" ? body._type : null;
  } catch {
    // Sanity webhooks normally send JSON, but an empty body should still be
    // able to trigger a full catalogue refresh.
  }

  const tags = type && TAG_BY_TYPE[type] ? TAG_BY_TYPE[type] : ALL_TAGS;
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: tags, type });
}

export function GET() {
  return NextResponse.json(
    { message: "Use POST from a Sanity webhook to revalidate catalogue data." },
    { status: 405, headers: { Allow: "POST" } },
  );
}
