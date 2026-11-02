import { PageHeader } from "@/components/admin/page-header";
import { getAllBrands, getProductList } from "@/lib/catalogue";
import Link from "next/link";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const [result, brands] = await Promise.all([
    getProductList({ q: q || null, sort: "name-asc", page, pageSize: 20 }),
    getAllBrands(),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue products from Sanity. Edit in Sanity Studio."
        actions={
          <a href="/studio" className="btn btn-primary">
            Open Sanity Studio
          </a>
        }
      />
      <form className="mb-3 d-flex gap-2" method="get">
        <input name="q" defaultValue={q} placeholder="Search by name, SKU, brand" className="form-control" style={{ maxWidth: 320 }} />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.brand?.name ?? "-"}</td>
                  <td className="font-monospace">{product.sku}</td>
                  <td>{product.price ?? "-"}</td>
                  <td>{product.availability}</td>
                  <td>
                    <a href={`/admin/products/${product._id}`} className="btn btn-sm btn-primary">
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-secondary">
        Total: {result.total} · Page {page}
      </p>
    </>
  );
}