export type TrackedEnquiryStatus = "pending" | "contacted" | "closed";

export type TrackedEnquiry = {
  id: string;
  createdAt: string;
  status: TrackedEnquiryStatus;
  items: Array<{ name: string; quantity: number; unit: string; sku?: string | null }>;
  customerNote?: string | null;
};

const STORAGE_KEY = "make-my-home-enquiry-tracking-v1";

export function loadTrackedEnquiries(): TrackedEnquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as TrackedEnquiry[]) : [];
  } catch {
    return [];
  }
}

export function saveTrackedEnquiry(entry: Omit<TrackedEnquiry, "id" | "createdAt" | "status">): TrackedEnquiry {
  const tracked: TrackedEnquiry = {
    id: `te-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    ...entry,
  };
  const current = loadTrackedEnquiries();
  const next = [tracked, ...current].slice(0, 50);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return tracked;
}

export function updateTrackedStatus(id: string, status: TrackedEnquiryStatus) {
  const current = loadTrackedEnquiries();
  const next = current.map((entry) =>
    entry.id === id ? { ...entry, status } : entry,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function removeTrackedEnquiry(id: string) {
  const current = loadTrackedEnquiries();
  const next = current.filter((entry) => entry.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}