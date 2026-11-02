"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "make-my-home-compare-v1";
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

type CompareContextValue = {
  items: string[];
  hydrated: boolean;
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readItems(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 4)
      : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function setItems(next: string[]) {
  cache = next.slice(0, 4);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

const getServerItems = () => EMPTY;
const getHydrated = () => true;
const getServerHydrated = () => false;
const subscribeHydration = () => () => {};

export function CompareProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItems, getServerItems);
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);

  const has = useCallback((id: string) => items.includes(id), [items]);
  const toggle = useCallback((id: string) => {
    const current = readItems();
    if (current.includes(id)) {
      setItems(current.filter((item) => item !== id));
    } else if (current.length < 4) {
      setItems([...current, id]);
    }
  }, []);
  const remove = useCallback((id: string) => {
    setItems(readItems().filter((item) => item !== id));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, hydrated, count: items.length, has, toggle, remove, clear }),
    [items, hydrated, has, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside CompareProvider");
  return context;
}