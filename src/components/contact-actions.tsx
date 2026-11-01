"use client";

import { MessageCircle, Phone } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useLocale } from "./locale-provider";

type ContactActionsProps = {
  phone: string | null | undefined;
  whatsappNumber: string | null | undefined;
  businessName: string | null | undefined;
  layout?: "row" | "stack";
  showMissing?: boolean;
  className?: string;
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function ContactActions({
  phone,
  whatsappNumber,
  businessName,
  layout = "row",
  showMissing = false,
  className = "",
}: ContactActionsProps) {
  const { t } = useLocale();
  const name = businessName?.trim() || "Make My Home";
  const message = t("whatsappMessageGeneric", { business: name });
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);
  const hasPhone = Boolean(phone?.trim());

  if (!whatsappUrl && !hasPhone) {
    return showMissing ? (
      <p className={`text-sm leading-relaxed text-ink-soft ${className}`}>
        {t("noContactYet")}
      </p>
    ) : null;
  }

  const base =
    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors";

  return (
    <div
      className={`flex ${layout === "stack" ? "flex-col items-stretch" : "flex-wrap items-center"} gap-2 ${className}`}
    >
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} bg-moss text-black hover:bg-moss/90`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {t("whatsappAsk")}
        </a>
      ) : null}
      {hasPhone ? (
        <a
          href={telHref(phone as string)}
          className={`${base} border border-line bg-white text-ink hover:border-ink`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {t("callShop")}
        </a>
      ) : null}
    </div>
  );
}
