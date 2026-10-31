import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLocale } from "@/lib/locale";
import { translate } from "@/lib/i18n";

export type Crumb = {
  label: string;
  href?: string;
};

export async function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const locale = await getLocale();

  return (
    <nav aria-label={translate(locale, "breadcrumbLabel")} className={`text-sm text-ink-soft ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
        <li>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center transition-colors hover:text-accent"
          >
            {translate(locale, "breadcrumbHome")}
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-soft/50" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="inline-flex min-h-11 items-center font-medium text-ink"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
