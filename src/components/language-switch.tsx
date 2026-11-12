"use client";

import { useLocale } from "./locale-provider";

export function LanguageSwitch({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const { locale, setLocale, t, pending } = useLocale();
  const dark = tone === "dark";

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={`inline-flex items-center rounded-full border ${
        dark ? "border-surface/25 bg-surface/10" : "border-line bg-surface"
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setLocale("hi")}
        aria-pressed={locale === "hi"}
        disabled={pending}
        className={`min-h-8 rounded-full px-3 text-[11px] font-bold transition-colors ${
          locale === "hi"
            ? dark
              ? "bg-surface text-primary-deep"
              : "bg-primary text-white"
            : dark
              ? "text-surface/70 hover:text-surface"
              : "text-ink-soft hover:text-ink"
        } disabled:opacity-70`}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        disabled={pending}
        className={`min-h-8 rounded-full px-3 text-[11px] font-bold transition-colors ${
          locale === "en"
            ? dark
              ? "bg-surface text-primary-deep"
              : "bg-primary text-white"
            : dark
              ? "text-surface/70 hover:text-surface"
              : "text-ink-soft hover:text-ink"
        } disabled:opacity-70`}
      >
        English
      </button>
    </div>
  );
}
