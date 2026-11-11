"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "./locale-provider";

/**
 * Small, non-blocking notice for slow or dropped connections. It never hides
 * product information and disappears as soon as the browser reports online.
 */
export function ConnectionBanner() {
  const { t } = useLocale();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="no-print border-b border-warning/50 bg-warning-soft px-4 py-2.5 text-center text-sm font-medium text-warning-text"
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        {t("connectionOffline")}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-sm border border-warning bg-white px-3 text-sm font-semibold"
        >
          {t("connectionRetry")}
        </button>
      </span>
    </div>
  );
}
