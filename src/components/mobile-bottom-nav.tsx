"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, LayoutGrid, Search } from "lucide-react";
import { useEnquiry } from "./enquiry-provider";
import { useLocale } from "./locale-provider";

const ITEMS = [
  { href: "/", key: "mobileHome", icon: Home, match: (path: string) => path === "/" },
  {
    href: "/categories",
    key: "mobileCategories",
    icon: LayoutGrid,
    match: (path: string) => path.startsWith("/categories") || path.startsWith("/category/"),
  },
  {
    href: "/search",
    key: "mobileSearch",
    icon: Search,
    match: (path: string) => path.startsWith("/search") || path.startsWith("/product/"),
  },
  {
    href: "/enquiry",
    key: "mobileList",
    icon: ClipboardList,
    match: (path: string) => path.startsWith("/enquiry"),
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { totalQuantity, hydrated } = useEnquiry();

  return (
    <nav
      aria-label={t("mainNavigation")}
      className="mobile-bottom-nav no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          const showCount = item.href === "/enquiry" && hydrated && totalQuantity > 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[3.65rem] flex-col items-center justify-center gap-1 px-1 pb-1 pt-2 text-[10px] font-bold tracking-wide transition-colors ${
                  active ? "text-primary-deep" : "text-ink-soft"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-5 top-0 h-0.5 transition-colors ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={active ? 2.2 : 1.7} />
                  {showCount ? (
                    <span className="absolute -right-2.5 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 py-0.5 text-[9px] font-bold leading-none text-charcoal">
                      {totalQuantity > 99 ? "99+" : totalQuantity}
                    </span>
                  ) : null}
                </span>
                <span>{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
