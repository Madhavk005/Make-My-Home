import { PageHeader } from "@/components/admin/page-header";
import { AdminEnquiries } from "@/components/admin-enquiries";

export default function AdminEnquiriesPage() {
  return (
    <>
      <PageHeader title="Enquiries" description="View and update enquiry status." />
      <AdminEnquiries />
    </>
  );
}