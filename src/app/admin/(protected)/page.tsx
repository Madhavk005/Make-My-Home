import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";
import { getAllBrands, getCatalogue } from "@/lib/catalogue";
import { pool } from "@/lib/db";

export default async function AdminDashboard() {
  const [catalogue, brands] = await Promise.all([getCatalogue(), getAllBrands()]);
  const enquiryCount = await pool
    .query("SELECT COUNT(*)::int AS c FROM enquiries")
    .then((result) => result.rows[0]?.c ?? 0)
    .catch(() => 0);

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of catalogue and enquiries." />
      <div className="row row-cards">
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Products" value={catalogue.totalProducts} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Categories" value={catalogue.categories.length} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Brands" value={brands.length} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Enquiries" value={enquiryCount} />
        </div>
      </div>
    </>
  );
}