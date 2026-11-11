import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getSiteSettings } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Make My Home privacy policy — what we collect (enquiries, contact details), why, how long we keep it, and your rights. No advertising trackers beyond analytics.",
};

export default async function PrivacyPage() {
  const [locale, settings] = await Promise.all([
    getLocale(),
    getSiteSettings().catch(() => null),
  ]);
  const hi = locale === "hi";
  const name = settings?.businessName?.trim() || "Make My Home";
  const updated = "2026-11-11";

  return (
    <div className="container-narrow py-10 sm:py-14">
      <p className="type-eyebrow no-rule">{hi ? "गोपनीयता नीति" : "Privacy Policy"}</p>
      <h1 className="type-h2 mt-2 font-extrabold text-ink">
        {hi ? `${name} की गोपनीयता नीति` : `${name} — Privacy Policy`}
      </h1>
      <p className="mt-1 text-xs text-ink-soft">
        {hi ? `अंतिम अपडेट: ${updated}` : `Last updated: ${updated}`}
      </p>

      <div className="mt-6 grid gap-5 text-sm leading-relaxed text-ink">
        <section>
          <h2 className="type-h3 text-ink">{hi ? "1. हम क्या एकत्र करते हैं" : "1. What we collect"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "जब आप पूछताछ फ़ॉर्म, कॉल या WhatsApp से हमसे संपर्क करते हैं, तो आप नाम, फ़ोन नंबर, सामग्री सूची और शहर/पिन कोड जैसे विवरण साझा करते हैं। खाता बनाने पर ईमेल और पासवर्ड (हैश किया हुआ) संग्रहीत होता है। साइट विश्लेषण हेतु बेनामी उपयोग आँकड़े (पेज व्यू, डिवाइस श्रेणी) भी एकत्र हो सकते हैं।"
              : "When you enquire via the form, phone or WhatsApp, you share details such as name, phone number, product list and city/PIN code. If you create an account, your email and a hashed password are stored. Anonymous analytics (page views, device class) may also be collected."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "2. हम इसका क्या उपयोग करते हैं" : "2. Why we use it"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "आपकी पूछताछ का जवाब देने, कीमत/उपलब्धता बताने, डिलीवरी समन्वित करने और खाता प्रबंधित करने के लिए केवल। हम आपका डेटा विज्ञापन एजेंसियों को नहीं बेचते। आवश्यक होने पर ही (जैसे कॉलबैक) विवरण साझा होते हैं — हमेशा दुकानदार या सेवा प्रदाता तक सीमित।"
              : "Only to answer your enquiry, confirm price/availability, coordinate delivery and manage your account. We do not sell your data to advertisers. Details are shared only as needed (e.g., to arrange a callback), and always limited to the shop or service provider fulfilling your request."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "3. स्टोरेज और कुकीज़" : "3. Storage and cookies"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "पूछताछ सूची आपके ब्राउज़र के localStorage में रहती है — सर्वर पर नहीं। लॉगिन सेशन कुकीज़ में रखा जाता है। भाषा पसंद (mmh-locale) कुकी में संग्रहीत होती है। हम विज्ञापन-ट्रैकिंग कुकीज़ का उपयोग नहीं करते।"
              : "Your enquiry list lives in your browser’s localStorage — not on our servers. Sign-in sessions use cookies. Your language preference (mmh-locale) is stored in a cookie. We do not use advertising-tracking cookies."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "4. डेटा कितने समय रखा जाता है" : "4. Retention"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "पूछताछ रिकॉर्ड आपके विलम्बित व्यापार से जुड़े रहते हैं और दैनिक रिकॉर्ड हेतु सुरक्षित रखे जाते हैं। खाता हटाने या डेटा मिटाने का अनुरोध करने के लिए कृपया हमसे संपर्क करें — हम 30 दिनों में कार्रवाई करते हैं।"
              : "Enquiry records stay linked to your working relationship with the shop and are stored securely. To request account deletion or data erasure, contact us — we act within 30 days."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "5. आपके अधिकार" : "5. Your rights"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "आप अपने संग्रहीत डेटा को देखने, सुधारने या मिटाने के लिए अनुरोध कर सकते हैं, और पूछताछ/खाता बंद भी कर सकते हैं। अनुरोध भेजने के लिए "
              : "You may request to view, correct or erase your stored data, and to opt out of enquiries or close your account. To make a request, "}
            <Link href="/contact" className="font-semibold text-link underline underline-offset-2 hover:text-link-hover">
              {hi ? "संपर्क पेज" : "contact us"}
            </Link>
            {hi ? " पर जाएँ।" : "."}
          </p>
        </section>

        <section>
          <h2 className="type-h3 text-ink">{hi ? "6. परिवर्तन" : "6. Changes"}</h2>
          <p className="mt-1.5 text-ink-soft">
            {hi
              ? "यह नीति समय-समय पर अपडेट हो सकती है। महत्वपूर्ण बदलाव इस पेज पर अंतिम-अपडेट तिथि के साथ प्रकाशित होंगे।"
              : "This policy may be updated from time to time. Material changes will be published on this page with a revised last-updated date."}
          </p>
        </section>
      </div>
    </div>
  );
}
