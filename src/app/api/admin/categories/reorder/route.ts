import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-auth";
import { reorderCategories } from "@/lib/admin-categories";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await getAdminApiSession();
  if (!auth.session) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status },
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-categories:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const value = body as Record<string, unknown>;
  const parentId = typeof value.parentId === "string" ? value.parentId : null;
  const ids = Array.isArray(value.ids)
    ? value.ids.filter((id): id is string => typeof id === "string")
    : null;

  if (!ids) {
    return NextResponse.json({ error: "Provide an ordered list of ids." }, { status: 400 });
  }

  try {
    const result = await reorderCategories(parentId, ids, auth.session.user.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.errors[0] }, { status: result.status });
    }
    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error("Category reorder failed:", error);
    return NextResponse.json({ error: "Failed to reorder categories." }, { status: 500 });
  }
}
