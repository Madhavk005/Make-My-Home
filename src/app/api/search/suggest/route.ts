import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/catalogue";

/**
 * Small, capped typeahead payload for the header search. The heavy catalogue
 * query stays on the server, and the response is cached briefly at the edge so
 * repeated typing from the same village connection is cheap.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);

  if (query.length < 1) {
    return NextResponse.json(
      { products: [], categories: [], brands: [] },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
    );
  }

  try {
    const suggestions = await getSearchSuggestions(query);
    return NextResponse.json(suggestions, {
      headers: {
        "Cache-Control": "public, max-age=20, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    // Typeahead is an enhancement; never break the page if the catalogue is
    // temporarily unreachable. The full search page still works.
    return NextResponse.json(
      { products: [], categories: [], brands: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
