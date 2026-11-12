"use client";

import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Header location pill. Shows the configured service area (from Sanity site
 * settings) — never invents a location. If none is configured it links to
 * the contact page instead of fabricating one.
 */
export function LocationPill({
  serviceArea,
  hi,
}: {
  serviceArea: string | null;
  hi: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const area = serviceArea?.trim() || null;

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-1.5 rounded-md px-2 text-left transition-colors hover:bg-white/10"
      >
        <MapPin className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
        <span className="leading-tight">
          <span className="block text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
            {hi ? "डिलीवरी क्षेत्र" : "Deliver to"}
          </span>
          <span className="block max-w-40 truncate text-xs font-bold text-white">
            {area ?? (hi ? "क्षेत्र सेलेक्ट करें" : "Select location")}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/80 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={hi ? "डिलीवरी क्षेत्र" : "Delivery area"}
          className="absolute left-0 top-full z-[60] mt-2 w-72 rounded-lg border border-line bg-surface p-4 shadow-[var(--shadow-lift)]"
        >
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">
            {hi ? "डिलीवरी क्षेत्र" : "Delivery area"}
          </p>
          {area ? (
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">{area}</p>
          ) : (
            <p className="mt-1.5 text-sm text-ink-soft">
              {hi
                ? "अभी कोई क्षेत्र सेट नहीं है। संपर्क पेज पर अपना पिन कोड शेयर करें।"
                : "No delivery area is configured yet. Share your PIN code on the contact page."}
            </p>
          )}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-link hover:underline"
          >
            {hi ? "स्थान बदलें / पूछताछ करें" : "Change location / enquire"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
