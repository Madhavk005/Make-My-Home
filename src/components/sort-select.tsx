"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import { buildCatalogHref, sortOptions, type CatalogFilters } from "@/lib/filters";
import type { SortKey } from "@/lib/types";
import { useLocale } from "./locale-provider";

export function SortSelect({
  basePath,
  filters,
}: {
  basePath: string;
  filters: CatalogFilters;
}) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [pending, startTransition] = useTransition();
  const options = sortOptions(locale);

  return (
    <label className="inline-flex items-center gap-2 text-xs text-ink-soft">
      <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-bold uppercase tracking-[0.08em]">{t("sort")}</span>
      <select
        value={filters.sort}
        disabled={pending}
        aria-label={t("sort")}
        onChange={(event) => {
          const sort = event.target.value as SortKey;
          startTransition(() => {
            router.push(buildCatalogHref(basePath, filters, { sort, page: 1 }), {
              scroll: false,
            });
          });
        }}
        className="h-10 border border-line bg-surface pl-2.5 pr-8 text-xs font-semibold text-ink focus:border-primary focus:outline-none disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
