import { PageHeader } from "@/components/admin/page-header";
import { AdminEnquiryDetail } from "@/components/admin-enquiry-detail";

export default async function AdminEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Enquiry detail" />
      <AdminEnquiryDetail id={id} />
    </>
  );
}