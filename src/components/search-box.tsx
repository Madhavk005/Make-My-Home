"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Clock3,
  LoaderCircle,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { formatINR } from "@/lib/format";
import type { SearchSuggestion } from "@/lib/types";
import { useLocale } from "./locale-provider";

type SearchBoxProps = {
  variant?: "header" | "page";
  initialQuery?: string;
  autoSubmit?: boolean;
  className?: string;
};

type FlatItem = {
  key: string;
  label: string;
  href: string;
  meta?: string;
  group: "recent" | "product" | "category" | "brand";
};

const RECENT_KEY = "mmh-recent-searches-v1";
const EMPTY: SearchSuggestion = { products: [], categories: [], brands: [] };

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function SearchBox({
  variant = "header",
  initialQuery = "",
  autoSubmit = false,
  className = "",
}: SearchBoxProps) {
  const { t, pending: localePending } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [seenQuery, setSeenQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<SearchSuggestion>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-listbox`;

  // Keep the field in step when the URL query changes (for example when a
  // filter chip is removed) without a state-setting effect.
  if (initialQuery !== seenQuery) {
    setSeenQuery(initialQuery);
    setValue(initialQuery);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    const query = value.trim();
    if (!open || query.length < 1) return;

    const controller = new AbortController();
    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : EMPTY))
        .then((data: SearchSuggestion) => {
          setSuggestions(data);
          setLoading(false);
          setActiveIndex(-1);
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name !== "AbortError") {
            setSuggestions(EMPTY);
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [value, open]);

  useEffect(() => {
    if (!autoSubmit) return;
    if (value === initialQuery) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = value.trim();
      startTransition(() => {
        router.replace(query ? `/search?q=${encodeURIComponent(query)}` : "/search", {
          scroll: false,
        });
      });
    }, 450);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, initialQuery, autoSubmit, router]);

  const flatItems = useMemo<FlatItem[]>(() => {
    const query = value.trim();
    if (!query) {
      return recent.map((item) => ({
        key: `recent-${item}`,
        label: item,
        href: `/search?q=${encodeURIComponent(item)}`,
        group: "recent" as const,
      }));
    }
    return [
      ...suggestions.products.map((product) => ({
        key: `product-${product.id}`,
        label: product.name,
        href: `/product/${encodeURIComponent(product.slug)}`,
        meta:
          product.priceStatus === "fixed" && typeof product.price === "number"
            ? formatINR(product.price)
            : product.priceStatus === "on_request"
              ? t("priceOnRequest")
              : t("priceNotSupplied"),
        group: "product" as const,
      })),
      ...suggestions.categories.map((category) => ({
        key: `category-${category.id}`,
        label: category.name,
        href: category.href,
        meta: t("productsCount", { count: category.count }),
        group: "category" as const,
      })),
      ...suggestions.brands.map((brand) => ({
        key: `brand-${brand.id}`,
        label: brand.name,
        href: `/brands/${encodeURIComponent(brand.slug)}`,
        meta: t("productsCount", { count: brand.count }),
        group: "brand" as const,
      })),
    ];
  }, [recent, suggestions, t, value]);

  const busy = pending || localePending;
  const isPage = variant === "page";
  const query = value.trim();
  const hasPanel = open && (query.length > 0 || recent.length > 0);

  function remember(term: string) {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...readRecent().filter((item) => item !== clean)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Private mode or a full storage quota should not block search.
    }
  }

  function go(href: string) {
    setOpen(false);
    inputRef.current?.blur();
    startTransition(() => router.push(href));
  }

  function submit() {
    const term = value.trim();
    remember(term);
    setOpen(false);
    inputRef.current?.blur();
    startTransition(() => {
      router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      if (flatItems.length === 0) return;
      setActiveIndex((index) => (index + 1) % flatItems.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((index) => (index <= 0 ? flatItems.length - 1 : index - 1));
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && flatItems[activeIndex]) {
      event.preventDefault();
      remember(query);
      go(flatItems[activeIndex].href);
    }
  }

  const groupLabels = {
    recent: t("recentSearches"),
    product: t("suggestionsProducts"),
    category: t("suggestionsCategories"),
    brand: t("suggestionsBrands"),
  };

  return (
    <div ref={container} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        aria-busy={busy}
      >
        <label htmlFor={id} className="sr-only">
          {t("searchLabel")}
        </label>
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-ink-soft ${
            isPage ? "h-5 w-5" : "h-4 w-4"
          }`}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          name="q"
          value={value}
          role="combobox"
          aria-expanded={hasPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && flatItems[activeIndex]
              ? `${id}-option-${activeIndex}`
              : undefined
          }
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            setOpen(true);
            setActiveIndex(-1);
            setSuggestions(EMPTY);
            setLoading(next.trim().length > 0);
          }}
          onFocus={() => {
            setOpen(true);
            if (recent.length === 0) setRecent(readRecent());
          }}
          onKeyDown={onKeyDown}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          enterKeyHint="search"
          className={`w-full border border-line bg-surface text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/15 ${
            isPage
              ? "min-h-14 rounded-sm pl-13 pr-28 text-base sm:pr-36"
              : "min-h-12 rounded-sm pl-11 pr-24 text-sm sm:text-base"
          } ${busy ? "opacity-80" : ""}`}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setSuggestions(EMPTY);
              setLoading(false);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label={t("clear")}
            className="absolute right-[4.6rem] top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-sand hover:text-ink sm:right-[5.4rem]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="submit"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xs bg-forest px-3 font-bold text-surface transition-colors hover:bg-forest-deep sm:px-4 ${
            isPage ? "min-h-11 text-sm" : "min-h-9 text-xs"
          }`}
        >
          {busy ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            t("searchButton")
          )}
        </button>
      </form>

      {hasPanel ? (
        <div
          className={`absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-sm border border-line bg-surface shadow-[0_24px_60px_-20px_rgb(19_37_28_/_0.28)] ${
            isPage ? "" : "min-w-[min(32rem,88vw)]"
          }`}
        >
          <div id={listId} role="listbox" aria-label={t("searchLabel")}>
            {loading && flatItems.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-5 text-sm text-ink-soft">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t("loading")}
              </p>
            ) : null}

            {!loading && query && flatItems.length === 0 ? (
              <p className="px-4 py-5 text-sm text-ink-soft">{t("noSuggestions")}</p>
            ) : null}

            {flatItems.length > 0 ? (
              <ul className="max-h-[min(26rem,65vh)] overflow-y-auto py-1">
                {flatItems.map((item, index) => {
                  const previous = flatItems[index - 1];
                  const showHeading = !previous || previous.group !== item.group;
                  const active = activeIndex === index;
                  return (
                    <li key={item.key}>
                      {showHeading ? (
                        <p className="flex items-center gap-2 px-4 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink-faint">
                          {item.group === "recent" ? (
                            <Clock3 className="h-3 w-3" aria-hidden="true" />
                          ) : item.group === "product" ? (
                            <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          ) : null}
                          {groupLabels[item.group]}
                        </p>
                      ) : null}
                      <Link
                        id={`${id}-option-${index}`}
                        href={item.href}
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          remember(query || item.label);
                          setOpen(false);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors ${
                          active ? "bg-sand" : "hover:bg-canvas"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {item.label}
                          </span>
                          {item.group === "product" && suggestions.products.find((p) => `product-${p.id}` === item.key)?.brand ? (
                            <span className="mt-0.5 block truncate text-xs text-ink-soft">
                              {suggestions.products.find((p) => `product-${p.id}` === item.key)?.brand}
                              {" · "}
                              {suggestions.products.find((p) => `product-${p.id}` === item.key)?.category}
                            </span>
                          ) : null}
                        </span>
                        {item.meta ? (
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-soft">
                            {item.meta}
                          </span>
                        ) : null}
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          {query ? (
            <button
              type="button"
              onClick={submit}
              className="flex min-h-12 w-full items-center justify-between gap-2 border-t border-line bg-canvas px-4 text-sm font-bold text-forest transition-colors hover:bg-sand"
            >
              <span className="truncate">{t("searchAllFor", { query })}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          ) : recent.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setRecent([]);
                try {
                  window.localStorage.removeItem(RECENT_KEY);
                } catch {
                  // Ignore storage failures.
                }
              }}
              className="flex min-h-11 w-full items-center justify-center border-t border-line bg-canvas px-4 text-xs font-semibold text-ink-soft transition-colors hover:text-clay"
            >
              {t("clearRecent")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
