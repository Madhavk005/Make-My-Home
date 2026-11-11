"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useLocale } from "./locale-provider";

type CategoryOption = { id: string; name: string };

type Props = {
  whatsappNumber: string | null;
  businessName: string;
  categories: CategoryOption[];
};

export function ProductEnquiryForm({ whatsappNumber, businessName, categories }: Props) {
  const { locale } = useLocale();
  const hi = locale === "hi";
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [spec, setSpec] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [requirements, setRequirements] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "opening" | "opened">("idle");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!productName.trim()) {
      setStatus("error");
      setError(hi ? "कृपया सामान का नाम लिखें।" : "Please enter the product name.");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setStatus("error");
      setError(hi ? "कृपया सही मात्रा लिखें।" : "Please enter a valid quantity.");
      return;
    }

    const categoryName =
      categories.find((category) => category.id === categoryId)?.name ?? "";

    const lines: string[] = [
      hi
        ? `नमस्ते ${businessName}, मुझे इस सामान के बारे में पूछना है:`
        : `Hello ${businessName}, I would like to enquire about:`,
      "",
      `${hi ? "सामान" : "Product"}: ${productName.trim()}`,
    ];
    if (categoryName) lines.push(`${hi ? "श्रेणी" : "Category"}: ${categoryName}`);
    if (brand.trim()) lines.push(`${hi ? "ब्रांड" : "Brand"}: ${brand.trim()}`);
    if (spec.trim()) lines.push(`${hi ? "साइज़ / रंग / डाइमेंशन" : "Size / Colour / Dimensions"}: ${spec.trim()}`);
    lines.push(`${hi ? "मात्रा" : "Quantity"}: ${qty}${unit.trim() ? ` ${unit.trim()}` : ""}`);
    if (requirements.trim()) {
      lines.push("");
      lines.push(`${hi ? "अतिरिक्त जानकारी" : "Additional requirements"}: ${requirements.trim()}`);
    }
    lines.push("");
    lines.push(
      hi
        ? "कृपया कीमत, उपलब्धता और डिलीवरी बताएँ। धन्यवाद।"
        : "Please confirm the current rate, availability and delivery. Thank you.",
    );

    const url = buildWhatsAppUrl(whatsappNumber, lines.join("\n"));
    if (!url) {
      setStatus("error");
      setError(
        hi
          ? "WhatsApp नंबर अभी नहीं जोड़ा गया है। कृपया फोन करें।"
          : "WhatsApp number is not configured yet. Please call instead.",
      );
      return;
    }

    setStatus("opening");
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus("opened");
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-product" className="mb-1.5 block text-sm font-semibold text-ink">
            {hi ? "सामान का नाम" : "Product name"} <span className="text-danger">*</span>
          </label>
          <input
            id="enquiry-product"
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder={hi ? "जैसे: सीमेंट, PVC पाइप" : "e.g. Cement, PVC pipe"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="enquiry-category" className="mb-1.5 block text-sm font-semibold text-ink">
            {hi ? "श्रेणी" : "Category"}
          </label>
          <select id="enquiry-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass}>
            <option value="">{hi ? "श्रेणी चुनें (ज़रूरी नहीं)" : "Choose category (optional)"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-brand" className="mb-1.5 block text-sm font-semibold text-ink">
            {hi ? "ब्रांड" : "Brand"}
          </label>
          <input
            id="enquiry-brand"
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            placeholder={hi ? "जैसे: UltraTech" : "e.g. UltraTech"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="enquiry-spec" className="mb-1.5 block text-sm font-semibold text-ink">
            {hi ? "साइज़ / रंग / डाइमेंशन" : "Size / Colour / Dimensions"}
          </label>
          <input
            id="enquiry-spec"
            value={spec}
            onChange={(event) => setSpec(event.target.value)}
            placeholder={hi ? "जैसे: 50kg, 4 inch" : "e.g. 50kg, 4 inch"}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-quantity" className="mb-1.5 block text-sm font-semibold text-ink">
            {hi ? "मात्रा" : "Quantity"} <span className="text-danger">*</span>
          </label>
          <input
            id="enquiry-quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="enquiry-unit" className="mb-1.5 block text-sm font-semibold text-ink">
            {hi ? "इकाई" : "Unit"}
          </label>
          <input
            id="enquiry-unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            placeholder={hi ? "जैसे: बोरी, मीटर" : "e.g. bag, metre"}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="enquiry-requirements" className="mb-1.5 block text-sm font-semibold text-ink">
          {hi ? "अतिरिक्त जानकारी" : "Additional requirements"}
        </label>
        <textarea
          id="enquiry-requirements"
          value={requirements}
          onChange={(event) => setRequirements(event.target.value)}
          rows={3}
          placeholder={hi ? "डिलीवरी, ब्रांड या अन्य जानकारी..." : "Delivery, brand or other details..."}
          className={inputClass}
        />
      </div>

      {status === "error" && error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      {status === "opened" ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {hi
            ? "WhatsApp खुल गया है। संदेश भेजकर पूछताछ पूरी करें।"
            : "WhatsApp opened. Send the message to complete your enquiry."}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "opening"}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-deep disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {status === "opening"
          ? hi
            ? "खुल रहा है..."
            : "Opening..."
          : hi
            ? "WhatsApp पर पूछें"
            : "Ask on WhatsApp"}
      </button>
    </form>
  );
}
