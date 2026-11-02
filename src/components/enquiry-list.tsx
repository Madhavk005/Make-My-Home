"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { availabilityMeta, formatINR, priceDisplay } from "@/lib/format";
import { attributeLabel, unitLabel } from "@/lib/i18n";
import { materialArt } from "@/lib/material-art";
import { buildEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { useEnquiry } from "./enquiry-provider";
import { saveTrackedEnquiry } from "@/lib/enquiry-tracking";
import { ProductImage } from "./product-image";
import { useLocale } from "./locale-provider";

type EnquiryListProps = {
  whatsappNumber: string | null;
  phone: string | null;
  businessName: string | null;
  priceNote: string | null;
};

export function EnquiryList({ whatsappNumber, phone, businessName, priceNote }: EnquiryListProps) {
  const { locale, t } = useLocale();
  const { items, hydrated, totalQuantity, updateQuantity, updateNotes, updateUnit, removeItem, clear } = useEnquiry();
  const [customerNote, setCustomerNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!hydrated) {
    return (
      <div className="mt-8 border border-line bg-surface px-6 py-12 text-center text-sm text-ink-soft">
        {t("loadingEnquiry")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 border border-line bg-surface px-6 py-14 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-line bg-sand text-ink-soft">
          <ClipboardList className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-medium tracking-tight text-ink">
          {t("enquiryEmptyTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          {t("enquiryEmptyBody")}
        </p>
        <Link href="/search" className="btn btn-primary mt-6">
          {t("browseCatalogue")}
        </Link>
      </div>
    );
  }

  const message = buildEnquiryMessage(items, {
    businessName,
    priceNote,
    locale,
    customerNote,
    reference,
    customerName,
    customerMobile,
    deliveryLocation,
  });
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);

  async function prepareEnquiry() {
    if (!customerName.trim() || !customerMobile.trim()) {
      setSubmitStatus("Please enter your name and mobile number.");
      return;
    }
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerMobile: customerMobile.trim(),
          deliveryLocation: deliveryLocation.trim() || null,
          customerNote: customerNote.trim() || null,
          items,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save enquiry");
      }
      const data = await response.json();
      setReference(data.reference);

      const messageWithReference = `${message}\n\nEnquiry Reference: ${data.reference}`;
      const url = buildWhatsAppUrl(whatsappNumber, messageWithReference);
      if (!url) throw new Error("Business WhatsApp number is not configured.");

      setSubmitStatus(
        `Enquiry ${data.reference} prepared. WhatsApp opened — please press Send to deliver it.`,
      );
      window.location.assign(url);
    } catch (error) {
      setSubmitStatus(error instanceof Error ? error.message : "Failed to save enquiry");
    } finally {
      setSubmitting(false);
    }
  }
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const fixedTotal = items.reduce((total, item) => {
    if (item.priceStatus === "fixed" && typeof item.price === "number" && item.price > 0) {
      return total + item.price * item.quantity;
    }
    return total;
  }, 0);
  const fixedLineCount = items.filter(
    (item) => item.priceStatus === "fixed" && typeof item.price === "number" && item.price > 0,
  ).length;
  const hasUnpriced = fixedLineCount < items.length;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <p className="text-xs text-ink-soft">
            <span className="font-semibold text-ink">{items.length}</span> {t("lineItems")} ·{" "}
            {totalQuantity} {t("unitWord")}
          </p>
          <button
            type="button"
            onClick={clear}
            className="no-print inline-flex min-h-10 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft transition-colors hover:text-forest"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("clearList")}
          </button>
          <button
            type="button"
            onClick={() => {
              saveTrackedEnquiry({
                items: items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  sku: item.sku,
                })),
                customerNote,
              });
              alert("Saved for follow-up");
            }}
            className="no-print inline-flex min-h-10 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft transition-colors hover:text-forest"
          >
            Save for follow-up
          </button>
        </div>

        <ul className="mt-4 space-y-2.5">
          {items.map((item) => {
            const display = priceDisplay(
              {
                price: item.price,
                priceStatus: item.priceStatus,
                unit: item.unit,
              },
              locale,
            );
            const availability = availabilityMeta(item.availability, locale);
            const lineTotal =
              item.priceStatus === "fixed" && typeof item.price === "number" && item.price > 0
                ? item.price * item.quantity
                : null;

            return (
              <li key={item.key} className="border border-line bg-surface p-3.5 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Link
                    href={`/product/${encodeURIComponent(item.slug)}`}
                    className="w-20 shrink-0 overflow-hidden border border-line bg-sand sm:w-24"
                    tabIndex={-1}
                  >
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      sizes="96px"
                      compact
                      fallbackSrc={materialArt(item.name, item.brand)}
                      className="aspect-square w-full"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.brand ? (
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-forest">
                            {item.brand}
                          </p>
                        ) : null}
                        <h2 className="mt-0.5 text-[0.95rem] font-semibold leading-snug text-ink">
                          <Link
                            href={`/product/${encodeURIComponent(item.slug)}`}
                            className="transition-colors hover:text-forest"
                          >
                            {item.name}
                          </Link>
                        </h2>
                        {item.variantLabel ? (
                          <p className="mt-0.5 text-xs text-ink-soft">
                            {t("variant")}: {item.variantLabel}
                          </p>
                        ) : null}
                        {item.attributes && item.attributes.length > 0 ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                            {item.attributes
                              .map(
                                (attribute) =>
                                  `${attributeLabel(attribute.name, locale)}: ${attribute.value}`,
                              )
                              .join(" · ")}
                          </p>
                        ) : null}
                        {item.sku ? (
                          <p className="mt-1 font-mono text-[10px] text-ink-faint">
                            {t("sku")} {item.sku}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`${t("removeItem")} — ${item.name}`}
                        className="no-print grid h-10 w-10 shrink-0 place-items-center text-ink-soft transition-colors hover:bg-sand hover:text-forest"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="font-display text-lg leading-none text-ink">
                          {display.primary}
                          {display.suffix ? (
                            <span className="ml-1 font-sans text-xs font-medium text-ink-soft">
                              {display.suffix}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${availability.dotClass}`}
                            aria-hidden="true"
                          />
                          {availability.label}
                        </p>
                      </div>

                      <div className="no-print flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`${t("decreaseQuantity")} — ${item.name}`}
                          className="grid h-10 w-10 place-items-center border border-line bg-surface text-ink transition-colors hover:border-ink disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <label className="sr-only" htmlFor={`quantity-${item.key}`}>
                          {t("quantity")} — {item.name}
                        </label>
                        <input
                          id={`quantity-${item.key}`}
                          type="number"
                          min={1}
                          max={9999}
                          step={1}
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isFinite(value)) updateQuantity(item.key, value);
                          }}
                          className="h-10 w-14 border border-line bg-canvas text-center text-sm font-semibold text-ink focus:border-clay focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          aria-label={`${t("increaseQuantity")} — ${item.name}`}
                          className="grid h-10 w-10 place-items-center border border-line bg-surface text-ink transition-colors hover:border-ink"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="ml-1 text-xs text-ink-soft">
                          {unitLabel(item.unit, locale)}
                        </span>
                      </div>

                      <div className="mt-2 flex w-full flex-col gap-1.5 sm:max-w-xs">
                        <label className="text-[11px] font-semibold text-ink-soft">
                          Unit
                        </label>
                        <input
                          value={item.unit}
                          onChange={(event) => updateUnit(item.key, event.target.value)}
                          className="h-9 rounded-md border border-line bg-canvas px-2 text-sm text-ink focus:border-clay focus:outline-none"
                        />
                      </div>
                      <div className="mt-2 w-full">
                        <label className="text-[11px] font-semibold text-ink-soft">
                          Notes
                        </label>
                        <textarea
                          value={item.notes ?? ""}
                          onChange={(event) => updateNotes(item.key, event.target.value)}
                          rows={2}
                          placeholder="Size, brand preference, delivery notes..."
                          className="mt-1 w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-sm text-ink focus:border-clay focus:outline-none"
                        />
                      </div>

                      {lineTotal !== null ? (
                        <p className="w-full text-right text-xs font-medium text-ink-soft sm:w-auto">
                          {t("estimatedTotal", { amount: formatINR(lineTotal) })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <Link href="/search" className="btn btn-secondary btn-sm">
            {t("addMoreProducts")}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t("printEstimate")}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            aria-expanded={showPreview}
            className="btn btn-secondary btn-sm"
          >
            {showPreview ? t("hidePreview") : t("previewMessage")}
          </button>
        </div>

        {showPreview ? (
          <pre className="no-print mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words border border-line bg-canvas p-4 font-sans text-sm leading-relaxed text-ink-soft">
            {message}
          </pre>
        ) : null}
      </div>

      <aside className="border border-line bg-surface lg:sticky lg:top-28">
        <div className="border-b border-line bg-forest px-5 py-5 text-surface">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">
            {t("enquiryKicker")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">
            {t("sendEnquiryTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-surface/70">{t("sendEnquiryBody")}</p>
        </div>

        <div className="p-5">
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">{t("lineItems")}</dt>
              <dd className="font-mono font-semibold text-ink">{items.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">{t("totalQuantity")}</dt>
              <dd className="font-mono font-semibold text-ink">{totalQuantity}</dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-t border-line pt-2.5">
              <dt className="text-ink-soft">{t("indicativeTotal")}</dt>
              <dd className="text-right font-semibold text-ink">
                {fixedLineCount > 0 ? formatINR(fixedTotal) : "—"}
                {hasUnpriced ? (
                  <span className="mt-0.5 block text-[11px] font-normal leading-relaxed text-ink-soft">
                    {t("excludesUnpriced")}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>

          <div className="mb-4">
            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">
              Customer note
            </label>
            <textarea
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              rows={3}
              placeholder="Delivery address, urgency, preferred brand..."
              className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
          </div>

          <div className="mb-4 space-y-2">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="min-h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
            <input
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder="Mobile number"
              className="min-h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
            <input
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder="Delivery location (optional)"
              className="min-h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink focus:border-clay focus:outline-none"
            />
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={2}
              placeholder="Customer note (optional)"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-clay focus:outline-none"
            />
            <button
              type="button"
              onClick={prepareEnquiry}
              disabled={submitting || items.length === 0}
              className="btn btn-whatsapp w-full"
            >
              {submitting ? "Saving enquiry..." : "Continue to WhatsApp"}
            </button>
            {submitStatus ? (
              <p className="text-xs leading-relaxed text-ink-soft">{submitStatus}</p>
            ) : null}
          </div>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp mt-4 w-full"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {t("sendOnWhatsApp")}
            </a>
          ) : (
            <p className="mt-4 border border-dashed border-line bg-canvas p-3 text-sm leading-relaxed text-ink-soft">
              {t("whatsappMissingHelp")}
            </p>
          )}

          {telHref ? (
            <a href={telHref} className="btn btn-secondary mt-2 w-full">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t("callShop")}
            </a>
          ) : null}

          <p className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-soft">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" aria-hidden="true" />
            {t("enquiryTrust")}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            {priceNote?.trim() || t("priceNoteDefault")}
          </p>
        </div>
      </aside>
    </div>
  );
}
