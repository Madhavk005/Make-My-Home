"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useEnquiry } from "./enquiry-provider";

type QuotationRequestProps = {
  whatsappNumber: string | null;
  phone: string | null;
  businessName: string | null;
};

export function QuotationRequest({
  whatsappNumber,
  phone,
  businessName,
}: QuotationRequestProps) {
  const { items } = useEnquiry();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [details, setDetails] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const business = businessName?.trim() || "Make My Home";
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const lines = [
      `Quotation request for ${business}`,
      `Name: ${name}`,
      `Phone: ${phoneNumber}`,
      email ? `Email: ${email}` : "",
      project ? `Project: ${project}` : "",
      details ? `Details: ${details}` : "",
      items.length
        ? `Items: ${items.map((item) => `${item.name} x ${item.quantity} ${item.unit}`).join("; ")}`
        : "",
    ].filter(Boolean);

    const url = buildWhatsAppUrl(whatsappNumber, lines.join("\n"));
    if (!url) {
      setWhatsappUrl(null);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    setWhatsappUrl(url);
  }

  if (!buildWhatsAppUrl(whatsappNumber, "Quotation request")) {
    return (
      <section className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Request a quotation</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Online quotation requests are not available yet because the business
          WhatsApp number has not been configured in Sanity Site Settings.
        </p>
        {telHref ? (
          <a
            href={telHref}
            className="btn-primary mt-6 inline-flex min-h-12 items-center gap-2"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {phone}
          </a>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">
            The business contact details have not been published yet. Please
            check back once Site Settings are complete.
          </p>
        )}
        <Link href="/contact" className="link-quiet mt-4 flex w-fit items-center gap-2">
          Contact page
        </Link>
      </section>
    );
  }

  if (whatsappUrl) {
    return (
      <section className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Request ready for WhatsApp
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Your quotation request has been prepared. WhatsApp should have opened
          in a new tab. <strong>Press Send in WhatsApp to submit it.</strong>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          This page cannot confirm that the message was sent.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 inline-flex min-h-12 items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Open WhatsApp again
        </a>
        <button
          type="button"
          onClick={() => setWhatsappUrl(null)}
          className="link-quiet mt-4 flex w-fit items-center gap-2"
        >
          Edit request
        </button>
        <Link href="/search" className="link-quiet mt-4 flex w-fit items-center gap-2">
          Continue browsing
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Request a quotation</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Share your bulk construction requirements and we&apos;ll send a consolidated quote.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="quote-name">
            Name
          </label>
          <input
            id="quote-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="quote-phone">
            Phone
          </label>
          <input
            id="quote-phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            type="tel"
            required
            className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="quote-email">
            Email (optional)
          </label>
          <input
            id="quote-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="quote-project">
            Project / site
          </label>
          <input
            id="quote-project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="quote-details">
            Requirements
          </label>
          <textarea
            id="quote-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-line px-3 py-2 text-base text-ink outline-none focus:border-primary"
          />
        </div>
        {items.length > 0 ? (
          <p className="text-xs text-ink-soft">
            {items.length} item(s) from your enquiry list will be included.
          </p>
        ) : null}
        <button
          type="submit"
          className="btn-primary inline-flex min-h-12 w-full items-center justify-center gap-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Prepare request in WhatsApp
        </button>
        <p className="text-xs leading-relaxed text-ink-soft">
          This opens WhatsApp with your details. Your request is only submitted
          when you press Send in WhatsApp.
        </p>
      </form>
    </section>
  );
}
