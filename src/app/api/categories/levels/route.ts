import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/catalogue";
import { categoriesByLevel } from "@/lib/categories";
import { CATEGORY_LEVELS, CATEGORY_LEVEL_DEPTH, CATEGORY_LEVEL_LABELS } from "@/lib/category-validation";

export const runtime = "nodejs";

export async function GET() {
  const { tree } = await getCatalogue();
  const groups = categoriesByLevel(tree);

  return NextResponse.json({
    levels: CATEGORY_LEVELS.map((level) => ({
      level,
      label: CATEGORY_LEVEL_LABELS[level],
      depth: CATEGORY_LEVEL_DEPTH[level],
      count: groups[level].length,
    })),
  });
}
