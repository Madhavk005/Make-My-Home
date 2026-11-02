"use client";

import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { useCompare } from "./compare-provider";

export function CompareLink() {
  const { count } = useCompare();
  return (
    <Link
      href="/compare"
      className="relative inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
    >
      <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Compare</span>
      {count > 0 ? (
        <span className="ml-1 rounded-full bg-forest px-1.5 text-[10px] font-bold text-surface">
          {count}
        </span>
      ) : null}
    </Link>
  );
}