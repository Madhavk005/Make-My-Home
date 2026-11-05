import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/catalogue";
import { getSettingWhatsAppNumber } from "@/lib/settings";
import { QuotationRequest } from "@/components/quotation-request";

export const metadata: Metadata = {
  title: "Request a quotation",
  robots: { index: false, follow: true },
};

export default async function QuotePage() {
  const settings = await getSiteSettings().catch(() => null);

  return (
    <div className="flex justify-center px-4 py-12">
      <QuotationRequest
        whatsappNumber={getSettingWhatsAppNumber(settings)}
        phone={settings?.phone?.trim() || null}
        businessName={settings?.businessName?.trim() || null}
      />
    </div>
  );
}
