"use client";

import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { useCompare } from "./compare-provider";

export function CompareLink() {
  const { count } = useCompare();
  return (
    <Link
      href="/compare"
      className="relative inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
    >
      <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Compare</span>
      {count > 0 ? (
        <span className="ml-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-charcoal">
          {count}
        </span>
      ) : null}
    </Link>
  );
}