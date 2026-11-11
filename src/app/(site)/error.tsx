"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-line bg-paper text-link">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t("errorTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-soft">
          {t("errorBody")}
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-soft/70">
            {t("errorReference", { digest: error.digest })}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center rounded-sm bg-ink px-5 text-sm font-semibold text-paper transition-colors hover:bg-accent"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-sm border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
