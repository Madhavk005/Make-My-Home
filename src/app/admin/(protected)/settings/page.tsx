import { PageHeader } from "@/components/admin/page-header";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Business settings." />
      <div className="card">
        <div className="card-body">
          <p className="text-secondary">Configure via environment variables and Sanity Studio.</p>
        </div>
      </div>
    </>
  );
}