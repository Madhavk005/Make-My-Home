import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/catalogue";
import { getLocale } from "@/lib/locale";
import { getSettingWhatsAppNumber, localizedSetting } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ContactActions } from "@/components/contact-actions";

export const metadata: Metadata = {
  title: "Delivery availability",
  robots: { index: false, follow: true },
};

export default async function DeliveryPage() {
  const [settings, locale] = await Promise.all([
    getSiteSettings().catch(() => null),
    getLocale(),
  ]);

  const hi = locale === "hi";
  const serviceArea = localizedSetting(settings, "serviceArea", locale);
  const phone = settings?.phone?.trim() || null;
  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    hi
      ? `नमस्ते ${businessName}, मुझे डिलीवरी की जानकारी चाहिए। मेरा पिनकोड: `
      : `Hello ${businessName}, I would like to confirm delivery. My pincode is: `,
  );

  return (
    <div className="container section-sm">
      <div className="mx-auto max-w-2xl rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="type-eyebrow">{hi ? "डिलीवरी" : "Delivery"}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {hi ? "डिलीवरी उपलब्धता" : "Delivery availability"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {hi
            ? "हम इस पेज पर पिनकोड की सूची नहीं दिखाते। हर ऑर्डर की डिलीवरी सामान, मात्रा और स्थान के आधार पर अलग से तय होती है।"
            : "We do not publish a pincode list on this page. Delivery is confirmed individually based on the material, quantity and location."}
        </p>

        <div className="mt-6 border-t border-line pt-5">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-ink">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
            <span>
              <strong>{hi ? "सेवा क्षेत्र: " : "Service area: "}</strong>
              {serviceArea ||
                (hi
                  ? "अभी सेवा क्षेत्र दर्ज नहीं है।"
                  : "Not configured yet.")}
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {hi
              ? "डिलीवरी की पुष्टि के लिए अपना पिनकोड और सामान की सूची WhatsApp पर भेजें। दुकान उपलब्धता और शुल्क बताएगी।"
              : "To confirm delivery, send your pincode and item list on WhatsApp. The shop will reply with availability and charges."}
          </p>
        </div>

        <div className="mt-6">
          <ContactActions
            phone={phone}
            whatsappNumber={whatsappNumber}
            businessName={businessName}
            showMissing
          />
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {hi ? "पिनकोड के साथ WhatsApp करें" : "Send pincode on WhatsApp"}
          </a>
        ) : null}

        <Link
          href="/quote"
          className="mt-6 flex w-fit items-center gap-2 border-t border-line pt-5 text-sm font-semibold text-forest hover:underline"
        >
          {hi ? "कोटेशन का अनुरोध करें" : "Request a quotation"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
