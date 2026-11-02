import { PageHeader } from "@/components/admin/page-header";

export default function AdminCmsPage() {
  return (
    <>
      <PageHeader title="Website CMS" description="Manage website content in Sanity Studio." />
      <div className="card">
        <div className="card-body">
          <a href="/studio" className="btn btn-primary">
            Open Sanity Studio
          </a>
        </div>
      </div>
    </>
  );
}