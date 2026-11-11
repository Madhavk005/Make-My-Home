"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Check, Palette } from "lucide-react";
import { useLocale } from "./locale-provider";

type PaletteId = "warm-natural" | "refined-modern" | "earthy-contemporary";

type PaletteOption = {
  id: PaletteId;
  label: { en: string; hi: string };
  swatches: [string, string, string];
  themeColor: string;
};

const DEFAULT_PALETTE: PaletteId = "warm-natural";
const STORAGE_KEY = "make-my-home-palette";

const paletteOptions: PaletteOption[] = [
  {
    id: "warm-natural",
    label: { en: "Warm natural", hi: "प्राकृतिक गर्माहट" },
    swatches: ["#29483D", "#F4F0E7", "#C87554"],
    themeColor: "#F4F0E7",
  },
  {
    id: "refined-modern",
    label: { en: "Refined modern", hi: "परिष्कृत आधुनिक" },
    swatches: ["#15324A", "#EFF3F6", "#C6A15B"],
    themeColor: "#EFF3F6",
  },
  {
    id: "earthy-contemporary",
    label: { en: "Earthy contemporary", hi: "मिट्टी के रंग" },
    swatches: ["#32332F", "#EEE6D8", "#87947C"],
    themeColor: "#EEE6D8",
  },
];

type PaletteContextValue = {
  palette: PaletteId;
  setPalette: (palette: PaletteId) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

function isPaletteId(value: string | null): value is PaletteId {
  return paletteOptions.some((option) => option.id === value);
}

const PALETTE_EVENT = "make-my-home-palette-change";

function applyPalette(palette: PaletteId) {
  document.documentElement.dataset.palette = palette;
  const themeColor = paletteOptions.find((option) => option.id === palette)?.themeColor;
  if (themeColor) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  }
}

function readStoredPalette(): PaletteId {
  try {
    const savedPalette = localStorage.getItem(STORAGE_KEY);
    return isPaletteId(savedPalette) ? savedPalette : DEFAULT_PALETTE;
  } catch {
    // The default palette remains available if browser storage is disabled.
    return DEFAULT_PALETTE;
  }
}

function getServerPalette(): PaletteId {
  return DEFAULT_PALETTE;
}

function subscribeToPalette(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(PALETTE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PALETTE_EVENT, callback);
  };
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const palette = useSyncExternalStore(
    subscribeToPalette,
    readStoredPalette,
    getServerPalette,
  );

  useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const setPalette = useCallback((nextPalette: PaletteId) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextPalette);
    } catch {
      // The selected palette still applies for this visit if storage is disabled.
    }
    applyPalette(nextPalette);
    window.dispatchEvent(new Event(PALETTE_EVENT));
  }, []);

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </PaletteContext.Provider>
  );
}

function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) throw new Error("usePalette must be used inside PaletteProvider");
  return context;
}

export function PaletteOptions({ onSelect }: { onSelect?: () => void }) {
  const { palette, setPalette } = usePalette();
  const { locale } = useLocale();

  return (
    <div
      role="group"
      aria-label={locale === "hi" ? "रंग योजना चुनें" : "Choose a color palette"}
      className="grid gap-1"
    >
      {paletteOptions.map((option) => {
        const active = palette === option.id;
        const label = locale === "hi" ? option.label.hi : option.label.en;

        return (
          <button
            key={option.id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => {
              setPalette(option.id);
              onSelect?.();
            }}
            className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-left text-xs font-semibold transition-colors ${
              active
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-transparent text-ink-soft hover:border-line hover:bg-sand"
            }`}
          >
            <span aria-hidden="true" className="inline-flex shrink-0 -space-x-1">
              {option.swatches.map((color) => (
                <span
                  key={color}
                  className="h-4 w-4 rounded-full border-2 border-surface"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            <span className="flex-1">{label}</span>
            {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function PaletteSwitcher() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { palette } = usePalette();
  const { locale } = useLocale();
  const activeOption = paletteOptions.find((option) => option.id === palette) ?? paletteOptions[0];
  const activeLabel = locale === "hi" ? activeOption.label.hi : activeOption.label.en;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={locale === "hi" ? `रंग योजना: ${activeLabel}` : `Color palette: ${activeLabel}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="palette-picker-options"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary-deep"
      >
        <Palette className="h-4 w-4" aria-hidden="true" />
        <span>{locale === "hi" ? "रंग" : "Palette"}</span>
      </button>

      {open ? (
        <div
          id="palette-picker-options"
          role="dialog"
          aria-label={locale === "hi" ? "रंग योजना चुनें" : "Choose a color palette"}
          className="absolute right-0 top-full z-[80] mt-2 w-56 rounded-lg border border-line bg-surface p-2 shadow-lg"
        >
          <PaletteOptions onSelect={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
