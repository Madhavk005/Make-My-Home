import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { buildCatalogHref, type CatalogFilters } from "@/lib/filters";

function pageList(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];
  for (const page of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === "number" && page - previous > 1) result.push("gap");
    result.push(page);
  }
  return result;
}

export async function Pagination({
  basePath,
  filters,
  page,
  totalPages,
}: {
  basePath: string;
  filters: CatalogFilters;
  page: number;
  totalPages: number;
}) {
  const locale = await getLocale();
  if (totalPages <= 1) return null;

  const previousHref = buildCatalogHref(basePath, filters, { page: page - 1 });
  const nextHref = buildCatalogHref(basePath, filters, { page: page + 1 });
  const button =
    "inline-flex min-h-11 items-center gap-1 border px-3 text-xs font-bold uppercase tracking-[0.06em] transition-colors";
  const enabled =
    "border-line bg-surface text-ink hover:border-primary hover:bg-primary-deep hover:text-white";
  const disabled = "border-line/60 text-ink-faint/60";

  return (
    <nav
      aria-label={translate(locale, "pagination")}
      className="mt-12 flex flex-wrap items-center justify-center gap-1.5 border-t border-line pt-6"
    >
      {page > 1 ? (
        <Link href={previousHref} rel="prev" className={`${button} ${enabled}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {translate(locale, "previousPage")}
        </Link>
      ) : (
        <span aria-disabled="true" className={`${button} ${disabled}`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {translate(locale, "previousPage")}
        </span>
      )}

      {pageList(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-ink-faint">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildCatalogHref(basePath, filters, { page: item })}
            aria-current={item === page ? "page" : undefined}
            aria-label={translate(locale, "pageNumber", { page: item })}
            className={`grid h-11 min-w-11 place-items-center border px-2 font-mono text-sm font-semibold transition-colors ${
              item === page
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-ink hover:border-primary"
            }`}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={nextHref} rel="next" className={`${button} ${enabled}`}>
          {translate(locale, "nextPage")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-disabled="true" className={`${button} ${disabled}`}>
          {translate(locale, "nextPage")}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
