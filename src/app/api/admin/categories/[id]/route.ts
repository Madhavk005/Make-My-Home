import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-auth";
import {
  deleteCategory,
  setCategoryActive,
  updateCategory,
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const value = body as Record<string, unknown>;

    // The tree view toggles visibility without sending the whole form.
    if (
      Object.keys(value).length === 1 &&
      typeof value.isActive === "boolean"
    ) {
      const result = await setCategoryActive(id, value.isActive, auth.session.user.email);
      if (!result.ok) {
        return NextResponse.json({ error: result.errors[0] }, { status: result.status });
      }
      return NextResponse.json({ id: result.id, isActive: value.isActive });
    }

    const input = parseInput(body);
    if (!input) {
      return NextResponse.json({ error: "Invalid category payload." }, { status: 400 });
    }

    const result = await updateCategory(id, input, auth.session.user.email);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.errors[0], errors: result.errors, fieldErrors: result.fieldErrors },
        { status: result.status },
      );
    }

    return NextResponse.json({ id: result.id, category: result.category });
  } catch (error) {
    console.error("Category update failed:", error);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  try {
    const result = await deleteCategory(id, auth.session.user.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.errors[0] }, { status: result.status });
    }
    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error("Category delete failed:", error);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
