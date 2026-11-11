import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";
import { getAdminCategoryTree } from "@/lib/admin-categories";
import { isSanityWriteConfigured } from "@/lib/sanity-write";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { categories } = await getAdminCategoryTree();
  const writesEnabled = isSanityWriteConfigured;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Manage the three-level catalogue: primary → secondary → tertiary."
        actions={
          <Link href="/studio" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
            Open Sanity Studio
          </Link>
        }
      />

      {!writesEnabled ? (
        <div className="alert alert-warning" role="status">
          Category changes are read-only here because{" "}
          <code>SANITY_API_WRITE_TOKEN</code> is not configured on this environment. You can still
          inspect the tree and use Sanity Studio.
        </div>
      ) : null}

      <CategoryManager initialCategories={categories} />
    </>
  );
}
