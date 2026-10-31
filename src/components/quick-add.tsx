"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useEnquiry } from "./enquiry-provider";
import { useLocale } from "./locale-provider";
import type { EnquiryItem } from "@/lib/types";

type QuickAddProps = {
  item: Omit<EnquiryItem, "quantity">;
  className?: string;
};

/**
 * Quick add for products that have no variants. Products with variants always
 * go through the variant selector so the enquiry cannot be ambiguous.
 */
export function QuickAdd({ item, className = "" }: QuickAddProps) {
  const { addItem } = useEnquiry();
  const { t } = useLocale();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        addItem({ ...item, quantity: 1 });
        setAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1800);
      }}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm border px-3 text-sm font-semibold transition-colors ${
        added
          ? "border-moss bg-moss-soft text-moss"
          : "border-line bg-white text-ink hover:border-ink"
      } ${className}`}
      aria-live="polite"
    >
      {added ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Plus className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="sr-only sm:not-sr-only">{added ? t("addedToList") : t("addToList")}</span>
      <span className="sm:hidden" aria-hidden="true">
        {added ? t("addedToList") : t("add")}
      </span>
    </button>
  );
}
