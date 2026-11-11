import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getSiteSettings } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Make My Home terms of use — indicative pricing, enquiry-based purchasing, availability and liability for the building materials and services marketplace.",
};

export default async function TermsPage() {
  const [locale, settings] = await Promise.all([
    getLocale(),
    getSiteSettings().catch(() => null),
  ]);
  const hi = locale === "hi";
  const name = settings?.businessName?.trim() || "Make My Home";
  const updated = "2026-11-11";

  return (
    <div className="container-narrow py-10 sm:py-14">
      <p className="type-eyebrow no-rule">{hi ? "नियम व शर्तें" : "Terms & Conditions"}</p>
      <h1 className="type-h2 mt-2 font-extrabold text-ink">
        {hi ? `${name} के नियम व शर्तें` : `${name} — Terms & Conditions`}
      </h1>
      <p className="mt-1 text-xs text-ink-soft">
        {hi ? `अंतिम अपडेट: ${updated}` : `Last updated: ${updated}`}
      </p>

      <div className="mt-6 grid gap-5 text-sm leading-relaxed text-ink">
        <section>
          <h2 className="type-h3 text-ink">{hi ? "1. यह वेबसाइट क्या है" : "1. What this website is"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? `${name} निर्माण सामग्री, घर सुधार के उत्पाद और पेशेवर सेवाओं के लिए कैटलॉग और पूछताछ मंच है। यह ऑनलाइन भुगतान या ऑर्डर पूरा करने की वेबसाइट नहीं है — आप सीधे दुकानदार या सेवा प्रदाता से संपर्क करते हैं।`
              : `${name} is a catalogue and enquiry platform for building materials, home-improvement products and professional services. It is not a checkout website — you contact the shop or service provider directly.`}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "2. कीमतें और उपलब्धता" : "2. Prices and availability"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "दिखाई गई कीमतें सिर्फ़ संकेतक हैं। पक्की कीमत, स्टॉक, ब्रांड और डिलीवरी की पुष्टि हमेशा दुकानदार से करनी होगी। मात्रा, साइज़ या वैरिएंट के आधार पर कीमत बदल सकती है और बोलियों/ऑफर के समय वैधता सीमित हो सकती है।"
              : "Prices shown are indicative only. Final price, stock, brand and delivery must be confirmed with the shop. Prices can vary by quantity, size or variant, and offers are valid only for the stated window."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "3. आपके ऑर्डर और दायित्व" : "3. Your orders and responsibilities"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "पूछताछ सूची (enquiry list) कोई ऑर्डर, कोटेशन या कानूनी रूप से बाध्य बिक्री का दस्तावेज़ नहीं है। सामग्री, माल या सेवा की वास्तविक आपूर्ति आपके और दुकानदार/ठेकेदार के बीच के अनुबंध से तय होती है, जिसमें कमी, विलंब या विवाद के लिए उनकी शर्तें लागू होती हैं।"
              : "Your enquiry list is not an order, quotation or binding sale. Actual supply of goods or services is governed by the agreement between you and the shop/contractor, and their terms apply for shortages, delays or disputes."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "4. कंटेंट और सूचना की सीमाएँ" : "4. Content and limitations"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "तस्वीरें, विवरण और स्पेसिफिकेशन जानकारी हेतु हैं और वास्तविक उत्पाद से सूक्ष्म रूप में भिन्न हो सकते हैं। उत्पाद डेटा Sanity CMS में दर्ज व्यवसाय द्वारा प्रबंधित किया जाता है; त्रुटियों के लिए हम उत्तरदायी नहीं हैं, कृपया पुष्टि ज़रूर करें।"
              : "Images, descriptions and specifications are informative and may differ slightly from actual products. Product data is managed in the CMS by the business; we are not liable for data errors and recommend confirmation before purchase."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "5. उपयोग" : "5. Use of the site"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "कृपया इस साइट का उपयोग केवल वैध रूप से करें, डेटा को गलत ढंग से न बदलें, न ही स्वचालित तरीकों से दुरुपयोग करें। खाता सुरक्षा और लॉगिन विवरण आपके अपने दायित्व में हैं।"
              : "Use this site lawfully, do not tamper with data, and do not abuse it via automation. Account security and login credentials are your responsibility."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "6. संपर्क" : "6. Contact"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi ? "इन शर्तों से जुड़े किसी भी प्रश्न के लिए " : "For any questions about these terms, please "}
            <Link href="/contact" className="font-semibold text-link underline underline-offset-2 hover:text-link-hover">
              {hi ? "संपर्क पेज" : "contact us"}
            </Link>
            {hi ? " पर जाएँ।" : "."}
          </p>
        </section>
      </div>

      <p className="mt-8 border-t border-line pt-5 text-xs text-ink-soft">
        {hi
          ? "ये मानक शर्तें मुद्रण समय पर लागू हैं और समय-समय पर अपडेट हो सकती हैं। अंतिम संस्करण हमेशा इस पेज पर रहेगी।"
          : "These standard terms apply as of the date above and may be updated from time to time. The latest version will always live on this page."}
      </p>
    </div>
  );
}
