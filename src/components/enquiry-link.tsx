"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useEnquiry } from "./enquiry-provider";
import { useLocale } from "./locale-provider";

export function EnquiryLink({ className = "" }: { className?: string }) {
  const { totalQuantity, hydrated } = useEnquiry();
  const { t } = useLocale();

  return (
    <Link
      href="/enquiry"
      className={`inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-sm font-bold text-ink transition-colors hover:border-ink/35 hover:text-forest ${className}`}
    >
      <ClipboardList className="h-4 w-4 text-clay" aria-hidden="true" />
      <span className="hidden md:inline">{t("enquiryList")}</span>
      {hydrated && totalQuantity > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-clay px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
      ) : null}
    </Link>
  );
}
