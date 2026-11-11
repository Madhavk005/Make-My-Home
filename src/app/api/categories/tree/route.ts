import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-auth";
import { getAdminCategoryTree } from "@/lib/admin-categories";
import { getCatalogue } from "@/lib/catalogue";
import { toNavNodes } from "@/lib/nav";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "1";

  if (includeInactive) {
    const auth = await getAdminApiSession();
    if (!auth.session) {
      return NextResponse.json(
        { error: auth.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: auth.status },
      );
    }

    const { tree } = await getAdminCategoryTree();
    return NextResponse.json({
      tree,
      nav: toNavNodes(tree),
      includeInactive: true,
    });
  }

  const catalogue = await getCatalogue();
  return NextResponse.json({
    tree: catalogue.tree,
    nav: toNavNodes(catalogue.tree),
    totalProducts: catalogue.totalProducts,
    includeInactive: false,
  });
}
