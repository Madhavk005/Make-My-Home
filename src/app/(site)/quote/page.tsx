import type { Metadata } from "next";
import { QuotationRequest } from "@/components/quotation-request";

export const metadata: Metadata = {
  title: "Request a quotation",
  robots: { index: true, follow: true },
};

export default function QuotePage() {
  return (
    <div className="flex justify-center px-4 py-12">
      <QuotationRequest />
    </div>
  );
}