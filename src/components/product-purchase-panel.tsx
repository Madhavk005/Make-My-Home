"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, MessageCircle, Minus, Phone, Plus } from "lucide-react";
import { availabilityMeta, formatINR, priceDisplay } from "@/lib/format";
import { attributeLabel, unitLabel } from "@/lib/i18n";
import { buildEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type {
  Availability,
  EnquiryItem,
  PriceStatus,
  VariantAttribute,
} from "@/lib/types";
import { useEnquiry } from "./enquiry-provider";
import { useLocale } from "./locale-provider";

export type VariantOption = {
  label: string;
  sku: string | null;
  attributes: VariantAttribute[];
  price: number | null;
  priceStatus: PriceStatus;
  unit: string;
  availability: Availability;
  imageUrl: string | null;
};

type ProductPurchasePanelProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    sku: string;
    price: number | null;
    priceStatus: PriceStatus;
    unit: string;
    availability: Availability;
    imageUrl: string | null;
  };
  variants: VariantOption[];
  whatsappNumber: string | null;
  phone: string | null;
  businessName: string | null;
  priceNote: string | null;
};

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.floor(value), 1), 9999);
}

export function ProductPurchasePanel({
  product,
  variants,
  whatsappNumber,
  phone,
  businessName,
  priceNote,
}: ProductPurchasePanelProps) {
  const { locale, t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useEnquiry();

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const variant = variants[selected] ?? null;
  const price = variant?.price ?? product.price;
  const priceStatus = variant?.priceStatus ?? product.priceStatus;
  const unit = variant?.unit || product.unit;
  const availability = variant?.availability ?? product.availability;
  const imageUrl = variant?.imageUrl ?? product.imageUrl;
  const display = priceDisplay({ price, priceStatus, unit }, locale);
  const availabilityInfo = availabilityMeta(availability, locale);
  const unitText = unitLabel(unit, locale);

  const item: EnquiryItem = {
    key: `${product.id}::${variant?.label ?? "default"}`,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    sku: variant?.sku || product.sku,
    variantLabel: variant?.label ?? null,
    attributes: variant?.attributes ?? [],
    price,
    priceStatus,
    unit,
    availability,
    quantity,
    imageUrl,
  };

  const message = buildEnquiryMessage([item], { businessName, priceNote, locale });
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const hasFixedPrice =
    typeof price === "number" && priceStatus === "fixed" && price > 0;

  return (
    <div className="mt-6">
      <section
        aria-label={t("price")}
        className="border border-line bg-surface"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              {t("price")}
            </p>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                {display.primary}
              </span>
              {display.suffix ? (
                <span className="text-sm font-medium text-ink-soft">{display.suffix}</span>
              ) : null}
            </p>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
              {display.note || priceNote?.trim() || t("priceNoteDefault")}
            </p>
          </div>
          <p className="inline-flex min-h-8 items-center gap-2 border border-line bg-canvas px-2.5 text-xs font-semibold text-ink-soft">
            <span
              className={`h-2 w-2 rounded-full ${availabilityInfo.dotClass}`}
              aria-hidden="true"
            />
            {availabilityInfo.label}
          </p>
        </div>
      </section>

      {variants.length > 0 ? (
        <section className="mt-4 border border-line bg-surface p-5 sm:p-6">
          <fieldset>
            <legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              {t("chooseVariant")}
            </legend>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label={t("variant")}>
              {variants.map((option, index) => {
                const optionPrice = priceDisplay(
                  {
                    price: option.price ?? product.price,
                    priceStatus: option.priceStatus ?? product.priceStatus,
                    unit: option.unit || product.unit,
                  },
                  locale,
                );
                const isSelected = index === selected;
                return (
                  <button
                    key={`${option.label}-${index}`}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelected(index)}
                    className={`flex min-h-14 w-full items-start justify-between gap-3 border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary-soft/60"
                        : "border-line bg-surface hover:border-ink/35"
                    }`}
                  >
                    <span className="flex min-w-0 items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          isSelected ? "border-primary" : "border-line"
                        }`}
                      >
                        {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.95rem] font-semibold leading-snug text-ink">
                          {option.label}
                        </span>
                        {option.attributes.length > 0 ? (
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                            {option.attributes
                              .map(
                                (attribute) =>
                                  `${attributeLabel(attribute.name, locale)}: ${attribute.value}`,
                              )
                              .join(" · ")}
                          </span>
                        ) : null}
                        {option.sku ? (
                          <span className="mt-0.5 block font-mono text-[11px] text-ink-faint">
                            {option.sku}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm font-bold text-ink">
                      {optionPrice.primary}
                      {optionPrice.suffix ? (
                        <span className="block text-xs font-medium text-ink-soft">
                          {optionPrice.suffix}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>
      ) : null}

      <section className="mt-4 border border-line bg-surface p-5 sm:p-6">
        <label htmlFor="enquiry-quantity" className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          {t("quantity")} · {unitText}
        </label>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((current) => clampQuantity(current - 1))}
            disabled={quantity <= 1}
            aria-label={t("decreaseQuantity")}
            className="grid h-12 w-12 place-items-center border border-line bg-surface text-ink transition-colors hover:border-ink disabled:opacity-40"
          >
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <input
            id="enquiry-quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={9999}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(clampQuantity(Number(event.target.value)))}
            className="h-12 w-20 border border-line bg-canvas text-center text-base font-semibold text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((current) => clampQuantity(current + 1))}
            aria-label={t("increaseQuantity")}
            className="grid h-12 w-12 place-items-center border border-line bg-surface text-ink transition-colors hover:border-ink"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="min-w-0 flex-1 text-xs leading-relaxed text-ink-soft">
            {hasFixedPrice
              ? `${t("estimatedTotal", { amount: formatINR((price as number) * quantity) })} · ${t("estimatedNote")}`
              : t("rateConfirmedOnEnquiry")}
          </span>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            addItem(item);
            setAdded(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setAdded(false), 2000);
          }}
          className={`btn flex-1 ${added ? "btn-primary" : "btn-accent"}`}
        >
          {added ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Plus className="h-5 w-5" aria-hidden="true" />
          )}
          {added ? t("addedToList") : t("addToList")}
        </button>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp flex-1"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {t("whatsappAsk")}
          </a>
        ) : telHref ? (
          <a href={telHref} className="btn btn-primary flex-1">
            <Phone className="h-5 w-5" aria-hidden="true" />
            {t("callShop")}
          </a>
        ) : (
          <span className="inline-flex min-h-12 flex-1 items-center justify-center border border-dashed border-line px-4 text-center text-sm text-ink-soft">
            {t("whatsappNumberMissing")}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {telHref ? (
          <a href={telHref} className="link-quiet">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t("callFallback")}
          </a>
        ) : null}
        <Link href="/enquiry" className="link-quiet">
          {t("reviewEnquiry")}
        </Link>
      </div>

      <details className="group mt-4 border border-line bg-surface p-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.1em] text-ink-soft [&::-webkit-details-marker]:hidden">
          {t("previewMessage")}
          <ChevronDown
            className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-line bg-canvas p-4 font-sans text-sm leading-relaxed text-ink-soft">
          {message}
        </pre>
      </details>
    </div>
  );
}
