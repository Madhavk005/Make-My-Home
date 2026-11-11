import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/catalogue";
import {
  categoryBreadcrumb,
  categoryHref,
  findCategoryByPath,
  findCategoryBySlug,
  flattenCategoryTree,
} from "@/lib/categories";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  const path = searchParams.get("path")?.trim();
  const id = searchParams.get("id")?.trim();

  if (!slug && !path && !id) {
    return NextResponse.json(
      { error: "Provide one of slug, path or id." },
      { status: 400 },
    );
  }

  const { categories, tree } = await getCatalogue();
  const all = flattenCategoryTree(tree);
  const category = id
    ? all.find((node) => node._id === id)
    : path
      ? findCategoryByPath(tree, path.split("/"))
      : findCategoryBySlug(categories, slug as string);

  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const node = all.find((item) => item._id === category._id);
  if (!node) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({
    category: node,
    canonicalPath: node.path,
    href: categoryHref(node.path),
    breadcrumb: categoryBreadcrumb(categories, node._id).map((item) => ({
      id: item._id,
      name: item.name,
      path: item.path,
      href: categoryHref(item.path),
    })),
    children: node.children.map((child) => ({
      id: child._id,
      name: child.name,
      slug: child.slug,
      path: child.path,
      level: child.level,
      href: categoryHref(child.path),
      productCount: child.productCount,
    })),
  });
}
