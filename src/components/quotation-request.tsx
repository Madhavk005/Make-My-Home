"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEnquiry } from "./enquiry-provider";

export function QuotationRequest() {
  const { items } = useEnquiry();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [project, setProject] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const lines = [
      "Quotation request",
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      project ? `Project: ${project}` : "",
      details ? `Details: ${details}` : "",
      items.length
        ? `Items: ${items.map((item) => `${item.name} x ${item.quantity} ${item.unit}`).join("; ")}`
        : "",
    ].filter(Boolean);
    const message = encodeURIComponent(lines.join("\n"));
    const number = "919999999999";
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="w-full max-w-lg rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Request received</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Your quotation request has been sent on WhatsApp. We&apos;ll get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="btn-primary mt-6 inline-flex min-h-12 items-center"
        >
          Continue browsing
        </button>
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
          <label className="mb-1.5 block text-sm font-semibold text-ink">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Email (optional)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Project / site</label>
          <input value={project} onChange={(e) => setProject(e.target.value)} className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Requirements</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="w-full rounded-lg border border-line px-3 py-2 text-base text-ink outline-none focus:border-accent" />
        </div>
        {items.length > 0 ? (
          <p className="text-xs text-ink-soft">
            {items.length} item(s) from your enquiry list will be included.
          </p>
        ) : null}
        <button type="submit" className="btn-primary inline-flex min-h-12 w-full items-center justify-center">
          Send quotation request
        </button>
      </form>
    </section>
  );
}