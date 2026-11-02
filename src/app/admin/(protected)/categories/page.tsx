import { PageHeader } from "@/components/admin/page-header";
import { getAllCategories } from "@/lib/catalogue";
import { buildCategoryTree, flattenCategoryTree } from "@/lib/categories";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();
  const tree = buildCategoryTree(categories);
  const flat = flattenCategoryTree(tree);

  return (
    <>
      <PageHeader title="Categories" description="Category hierarchy from Sanity." />
      <div className="card">
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {flat.map((category) => (
                <tr key={category._id}>
                  <td style={{ paddingLeft: `${category.depth * 16}px` }}>{category.name}</td>
                  <td className="font-monospace">{category.slug}</td>
                  <td>{category.parentId ?? "-"}</td>
                  <td>{category.productCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}