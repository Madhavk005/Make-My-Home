import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";

const requiredBusinessDetails = [
  "Verified business phone and WhatsApp number",
  "Business email and address",
  "Opening hours and service area",
  "Hindi business copy, with English copy where available",
];

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage the public business details shown across the storefront."
      />
      <div className="card">
        <div className="card-body">
          <p className="text-secondary">
            Business settings are managed in the Sanity Studio. The contact fields are required
            there so the storefront cannot be published with placeholder contact details.
          </p>
          <Link href="/studio" className="btn btn-primary mt-4 inline-flex min-h-11 items-center">
            Open Sanity Studio
          </Link>
          <h2 className="mt-6 font-semibold">Complete before launch</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-secondary">
            {requiredBusinessDetails.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
