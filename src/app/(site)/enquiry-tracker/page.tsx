import type { Metadata } from "next";
import { EnquiryTracker } from "@/components/enquiry-tracker";

export const metadata: Metadata = {
  title: "Enquiry tracking",
  robots: { index: false, follow: true },
};

export default function EnquiryTrackerPage() {
  return (
    <div className="container section-sm">
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
        WhatsApp enquiry tracking
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Track which enquiries need follow-up.
      </p>
      <div className="mt-6">
        <EnquiryTracker />
      </div>
    </div>
  );
}