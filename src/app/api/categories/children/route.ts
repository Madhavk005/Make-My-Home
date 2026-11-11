import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/catalogue";
import { flattenCategoryTree } from "@/lib/categories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const parentId = new URL(request.url).searchParams.get("parentId")?.trim() || null;
  const { tree } = await getCatalogue();
  const all = flattenCategoryTree(tree);
  const parent = parentId ? all.find((node) => node._id === parentId) : null;

  if (parentId && !parent) {
    return NextResponse.json({ error: "Parent category not found." }, { status: 404 });
  }

  const children = parentId ? (parent?.children ?? []) : tree;

  return NextResponse.json({
    parent: parent
      ? { id: parent._id, name: parent.name, path: parent.path, level: parent.level }
      : null,
    children: children.map((node) => ({
      id: node._id,
      name: node.name,
      slug: node.slug,
      level: node.level,
      path: node.path,
      href: `/category/${node.path.map(encodeURIComponent).join("/")}`,
      productCount: node.productCount,
      childCount: node.children.length,
    })),
  });
}
