import Link from "next/link";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/admin/page-header";
import { getAllBrands, getCatalogue } from "@/lib/catalogue";
import { pool } from "@/lib/db";

export default async function AdminDashboard() {
  const [catalogue, brands] = await Promise.all([getCatalogue(), getAllBrands()]);
  const metrics = await pool
    .query(`SELECT (SELECT COUNT(*)::int FROM enquiries) AS enquiries,
                   (SELECT COUNT(*)::int FROM enquiries WHERE status IN ('new','contacted')) AS pending,
                   (SELECT COUNT(*)::int FROM enquiries WHERE status = 'quoted') AS replied,
                   (SELECT COUNT(*)::int FROM "user") AS users,
                   (SELECT COUNT(*)::int FROM session WHERE expires_at > NOW()) AS active_users,
                   (SELECT COUNT(*)::int FROM orders) AS orders,
                   (SELECT COUNT(*)::int FROM payments WHERE status = 'paid') AS paid_payments`)
    .then((result) => result.rows[0] ?? {})
    .catch(() => ({} as Record<string, number>));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of catalogue and enquiries."
        actions={
          <Link href="/studio" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
            Open Sanity Studio
          </Link>
        }
      />
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
          <StatCard label="Enquiries" value={metrics.enquiries ?? 0} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Pending enquiries" value={metrics.pending ?? 0} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Quoted / replied" value={metrics.replied ?? 0} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Active users" value={`${metrics.active_users ?? 0} / ${metrics.users ?? 0}`} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Orders" value={metrics.orders ?? 0} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard label="Paid payments" value={metrics.paid_payments ?? 0} />
        </div>
      </div>
    </>
  );
}
