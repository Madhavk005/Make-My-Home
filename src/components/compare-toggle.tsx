"use client";

import { GitCompareArrows } from "lucide-react";
import { useCompare } from "./compare-provider";

export function CompareToggle({ productId, label }: { productId: string; label?: string }) {
  const { has, toggle, count } = useCompare();
  const active = has(productId);
  const disabled = !active && count >= 4;

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      disabled={disabled}
      aria-pressed={active}
      title={disabled ? "Compare list is full (max 4)" : "Add to compare"}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xs border px-2.5 text-xs font-bold transition-colors ${
        active
          ? "border-forest bg-forest text-surface"
          : "border-line bg-surface text-ink hover:border-forest"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
      {label ?? (active ? "Compared" : "Compare")}
    </button>
  );
}