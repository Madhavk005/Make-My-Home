"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { EnquiryItem } from "@/lib/types";

const STORAGE_KEY = "make-my-home-enquiry-v1";
const EMPTY_ITEMS: EnquiryItem[] = [];
const listeners = new Set<() => void>();

let cache: EnquiryItem[] | null = null;

type EnquiryContextValue = {
  items: EnquiryItem[];
  hydrated: boolean;
  totalQuantity: number;
  addItem: (item: EnquiryItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

const EnquiryContext = createContext<EnquiryContextValue | null>(null);

function sanitizeQuantity(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.floor(parsed), 1), 9999);
}

function isEnquiryItem(value: unknown): value is EnquiryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<EnquiryItem>;
  return Boolean(
    typeof item.key === "string" &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      typeof item.slug === "string" &&
      typeof item.unit === "string" &&
      typeof item.quantity === "number",
  );
}

function parseItems(stored: string | null): EnquiryItem[] {
  if (!stored) return EMPTY_ITEMS;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return EMPTY_ITEMS;
    return parsed
      .filter(isEnquiryItem)
      .map((item) => ({ ...item, quantity: sanitizeQuantity(item.quantity) }));
  } catch {
    // A malformed local enquiry list should not break the storefront.
    return EMPTY_ITEMS;
  }
}

function readItems(): EnquiryItem[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY_ITEMS;
  try {
    cache = parseItems(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage may be unavailable in private browsing. Keep the in-memory list.
    cache = EMPTY_ITEMS;
  }
  return cache;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null;
    emit();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getServerItems(): EnquiryItem[] {
  return EMPTY_ITEMS;
}

function setItems(updater: (current: EnquiryItem[]) => EnquiryItem[]) {
  const next = updater(readItems());
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable. Keep the in-memory list.
  }
  emit();
}

const subscribeToHydration = () => () => {};
const getHydrated = () => true;
const getServerHydrated = () => false;

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItems, getServerItems);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated,
  );

  const addItem = useCallback((item: EnquiryItem) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.key === item.key);
      if (existing) {
        return current.map((entry) =>
          entry.key === item.key
            ? { ...entry, quantity: sanitizeQuantity(entry.quantity + item.quantity) }
            : entry,
        );
      }
      return [...current, { ...item, quantity: sanitizeQuantity(item.quantity) }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.key === key ? { ...item, quantity: sanitizeQuantity(quantity) } : item,
      ),
    );
  }, []);

  const clear = useCallback(() => setItems(() => []), []);

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      hydrated,
      totalQuantity,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    }),
    [items, hydrated, totalQuantity, addItem, removeItem, updateQuantity, clear],
  );

  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
}

export function useEnquiry(): EnquiryContextValue {
  const context = useContext(EnquiryContext);
  if (!context) {
    throw new Error("useEnquiry must be used inside EnquiryProvider");
  }
  return context;
}
