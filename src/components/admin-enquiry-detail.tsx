"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "./admin/status-badge";

type Item = {
  productName: string;
  quantity: number;
  unit: string;
  sku?: string | null;
  brand?: string | null;
  attributes?: Record<string, unknown>;
  notes?: string | null;
};

type Enquiry = {
  id: string;
  reference: string;
  customer_name: string;
  customer_mobile: string;
  customer_location?: string | null;
  customer_note?: string | null;
  status: string;
  created_at: string;
  items: Item[];
};

const STATUSES = ["new", "contacted", "quoted", "converted", "cancelled"];

export function AdminEnquiryDetail({ id }: { id: string }) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/enquiries/${id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          setEnquiry(data);
          setStatus(data.status);
          setNotes(data.customer_note ?? "");
        }
      });
  }, [id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setSaving(false);
    const response = await fetch(`/api/enquiries/${id}`);
    const data = await response.json();
    setEnquiry(data);
  }

  if (!enquiry) return <p className="text-secondary">Loading...</p>;

  return (
    <div>
      <Link href="/admin/enquiries" className="btn btn-ghost-secondary mb-3">
        ← Back
      </Link>
      <div className="card mb-3">
        <div className="card-body">
          <h2 className="card-title">{enquiry.reference}</h2>
          <p className="text-secondary">{new Date(enquiry.created_at).toLocaleString()}</p>
          <div className="mt-3">
            <StatusBadge status={enquiry.status} />
          </div>
          <div className="mt-3">
            <p><strong>{enquiry.customer_name}</strong></p>
            <p>{enquiry.customer_mobile}</p>
            {enquiry.customer_location ? <p>{enquiry.customer_location}</p> : null}
            {enquiry.customer_note ? <p className="mt-2">Note: {enquiry.customer_note}</p> : null}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h3 className="card-title">Items</h3>
          <ul className="list-unstyled">
            {enquiry.items.map((item, index) => (
              <li key={index} className="mb-2">
                {item.productName} — {item.quantity} {item.unit}
                {item.sku ? ` (${item.sku})` : ""}
                {item.brand ? ` · ${item.brand}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="card-title">Follow-up</h3>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select mb-2">
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Follow-up notes"
            className="form-control mb-2"
          />
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}