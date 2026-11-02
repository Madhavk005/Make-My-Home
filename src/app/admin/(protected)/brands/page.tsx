import { PageHeader } from "@/components/admin/page-header";
import { getBrandsWithCounts } from "@/lib/catalogue";

export default async function AdminBrandsPage() {
  const brands = await getBrandsWithCounts();

  return (
    <>
      <PageHeader title="Brands" description="Brands from Sanity." />
      <div className="card">
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand._id}>
                  <td>{brand.name}</td>
                  <td className="font-monospace">{brand.slug}</td>
                  <td>{brand.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}