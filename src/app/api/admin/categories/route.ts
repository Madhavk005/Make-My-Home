import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-auth";
import {
  createCategory,
  getAdminCategoryTree,
  type CategoryAdminInput,
} from "@/lib/admin-categories";
import { isCategoryLevel } from "@/lib/category-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

function parseInput(body: unknown): CategoryAdminInput | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (typeof value.name !== "string" || typeof value.slug !== "string") return null;
  if (!isCategoryLevel(value.level)) return null;

  return {
    name: value.name,
    slug: value.slug,
    level: value.level,
    parentId: typeof value.parentId === "string" ? value.parentId : null,
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    order: typeof value.order === "number" ? value.order : undefined,
    description: typeof value.description === "string" ? value.description : null,
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : null,
    seoDescription: typeof value.seoDescription === "string" ? value.seoDescription : null,
  };
}

export async function GET(request: Request) {
  const auth = await getAdminApiSession();
  if (!auth.session) {
    return NextResponse.json(
      { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: auth.status },
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-categories:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const { categories, tree } = await getAdminCategoryTree();
    return NextResponse.json({ categories, tree });
  } catch (error) {
    console.error("Category list failed:", error);
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}

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

  const input = parseInput(body);
  if (!input) {
    return NextResponse.json({ error: "Invalid category payload." }, { status: 400 });
  }

  try {
    const result = await createCategory(input, auth.session.user.email);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.errors[0], errors: result.errors, fieldErrors: result.fieldErrors },
        { status: result.status },
      );
    }
    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    console.error("Category create failed:", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
