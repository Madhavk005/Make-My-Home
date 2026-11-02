"use client";

import { useEffect, useState } from "react";
import {
  loadTrackedEnquiries,
  updateTrackedStatus,
  removeTrackedEnquiry,
  type TrackedEnquiry,
} from "@/lib/enquiry-tracking";

export function EnquiryTracker() {
  const [entries, setEntries] = useState<TrackedEnquiry[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setEntries(loadTrackedEnquiries()), 0);
    return () => window.clearTimeout(id);
  }, []);

  function refresh() {
    setEntries(loadTrackedEnquiries());
  }

  if (entries.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
          No tracked enquiries yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Save an enquiry from your enquiry list to track follow-ups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-soft">
              {new Date(entry.createdAt).toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={entry.status}
                onChange={(event) => {
                  updateTrackedStatus(entry.id, event.target.value as TrackedEnquiry["status"]);
                  refresh();
                }}
                className="min-h-9 rounded-md border border-line bg-canvas px-2 text-sm text-ink"
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  removeTrackedEnquiry(entry.id);
                  refresh();
                }}
                className="text-xs text-ink-soft hover:text-forest"
              >
                Remove
              </button>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {entry.items.map((item, index) => (
              <li key={index}>
                {item.name} — {item.quantity} {item.unit}
                {item.sku ? ` (${item.sku})` : ""}
              </li>
            ))}
          </ul>
          {entry.customerNote ? (
            <p className="mt-2 text-xs text-ink-soft">Note: {entry.customerNote}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}