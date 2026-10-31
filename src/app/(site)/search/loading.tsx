"use client";

import { useLocale } from "@/components/locale-provider";

export default function SiteLoading() {
  const { t } = useLocale();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      <div className="h-4 w-40 animate-pulse rounded bg-line" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded bg-line" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded bg-line/70" />
          ))}
        </div>
        <div>
          <div className="h-11 animate-pulse rounded bg-line/70" />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="aspect-square animate-pulse bg-paper-deep" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-16 animate-pulse rounded bg-line" />
                  <div className="h-4 w-full animate-pulse rounded bg-line" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
                  <div className="h-6 w-24 animate-pulse rounded bg-line" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
