"use client";

import { useCallback, useEffect, useState } from "react";
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
  customer_phone: string;
  customer_location?: string | null;
  customer_note?: string | null;
  admin_notes?: string | null;
  status: string;
  created_at: string;
  quote_token?: string | null;
  quote_amount?: string | number | null;
  quote_reply?: string | null;
  items: Item[];
};

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "review" | "paid" | "failed" | "refunded";
  method: string | null;
  utr: string | null;
  createdAt: string;
  confirmedAt: string | null;
};

const STATUSES = ["new", "contacted", "quoted", "converted", "cancelled"];

const PAYMENT_LABEL: Record<Payment["status"], string> = {
  pending: "Checkout opened",
  review: "Awaiting bank check",
  paid: "Paid",
  failed: "Not completed",
  refunded: "Refunded",
};

type LoadedData = {
  enquiryData: Enquiry | null;
  paymentData: Payment | null;
};

async function fetchEnquiry(id: string): Promise<LoadedData> {
  const [enquiryResponse, paymentResponse] = await Promise.all([
    fetch(`/api/enquiries/${id}`),
    fetch(`/api/admin/payments?enquiryId=${encodeURIComponent(id)}`),
  ]);

  const enquiryData = enquiryResponse.ok ? ((await enquiryResponse.json()) as Enquiry) : null;
  const payments = paymentResponse.ok
    ? ((await paymentResponse.json()) as { payments: Payment[] }).payments
    : [];

  return { enquiryData, paymentData: payments?.[0] ?? null };
}

export function AdminEnquiryDetail({ id }: { id: string }) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteReply, setQuoteReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState("");

  const applyData = useCallback(({ enquiryData, paymentData }: LoadedData) => {
    if (enquiryData) {
      setEnquiry(enquiryData);
      setStatus(enquiryData.status);
      setNotes(enquiryData.admin_notes ?? "");
      setQuoteAmount(enquiryData.quote_amount ? String(enquiryData.quote_amount) : "");
      setQuoteReply(enquiryData.quote_reply ?? "");
    }
    setPayment(paymentData);
  }, []);

  useEffect(() => {
    fetchEnquiry(id)
      .then(applyData)
      .catch(() => setError("Could not load this enquiry."));
  }, [id, applyData]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { status, notes };

      if (status === "quoted") {
        const amount = Number(quoteAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Enter a positive approved amount before saving a quote.");
        }
        if (!quoteReply.trim()) {
          throw new Error("Add a reply for the customer before saving a quote.");
        }
        payload.quoteAmount = amount;
        payload.quoteReply = quoteReply.trim();
      }

      const response = await fetch(`/api/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save changes.");
      }
      applyData(await fetchEnquiry(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function decide(decision: "verified" | "rejected") {
    if (!payment) return;
    if (decision === "rejected" && !rejectNote.trim()) {
      setError("Add a reason before rejecting a payment.");
      return;
    }

    setDeciding(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/payments/${payment.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: decision === "rejected" ? rejectNote.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to record the decision.");
      }

      setRejectNote("");
      applyData(await fetchEnquiry(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to record the decision.");
    } finally {
      setDeciding(false);
    }
  }

  if (!enquiry) return <p className="text-secondary">Loading...</p>;

  const quoteLink =
    enquiry.quote_token && typeof window !== "undefined"
      ? `${window.location.origin}/quote/${enquiry.quote_token}`
      : null;

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
            <p>{enquiry.customer_phone}</p>
            {enquiry.customer_location ? <p>{enquiry.customer_location}</p> : null}
            {enquiry.customer_note ? (
              <p className="mt-2"><strong>Customer note:</strong> {enquiry.customer_note}</p>
            ) : null}
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

      {payment ? (
        <div className="card mb-3">
          <div className="card-body">
            <h3 className="card-title">Online payment</h3>
            <p className="mt-1">
              <strong>₹{payment.amount.toFixed(2)}</strong> · {PAYMENT_LABEL[payment.status]}
              {payment.method ? ` · ${payment.method}` : ""}
            </p>
            <p className="text-secondary">
              Started {new Date(payment.createdAt).toLocaleString()}
              {payment.confirmedAt
                ? ` · Confirmed ${new Date(payment.confirmedAt).toLocaleString()}`
                : ""}
            </p>
            {payment.utr ? (
              <p className="mt-2">
                <strong>UPI reference:</strong> <span className="font-mono">{payment.utr}</span>
              </p>
            ) : null}

            {payment.status === "review" || payment.status === "pending" ? (
              <div className="mt-3">
                <p className="text-secondary">
                  Check the receiving bank account for this amount and UPI reference before confirming.
                </p>
                <label htmlFor="payment-reject-note" className="form-label mt-3">
                  Rejection reason (only needed if rejecting)
                </label>
                <input
                  id="payment-reject-note"
                  className="form-control mb-2"
                  value={rejectNote}
                  onChange={(event) => setRejectNote(event.target.value)}
                  placeholder="Amount not received / wrong reference"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => decide("verified")}
                    disabled={deciding}
                    className="btn btn-primary"
                  >
                    {deciding ? "Saving…" : "Confirm money received"}
                  </button>
                  <button
                    type="button"
                    onClick={() => decide("rejected")}
                    disabled={deciding}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-body">
          <h3 className="card-title">Follow-up</h3>
          <label htmlFor="enquiry-status" className="form-label">Status</label>
          <select
            id="enquiry-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select mb-2"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          {status === "quoted" ? (
            <>
              <label htmlFor="quote-amount" className="form-label">
                Approved amount (₹)
              </label>
              <input
                id="quote-amount"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                className="form-control mb-2"
                value={quoteAmount}
                onChange={(event) => setQuoteAmount(event.target.value)}
                placeholder="12500"
              />
              <label htmlFor="quote-reply" className="form-label">
                Reply shown to the customer
              </label>
              <textarea
                id="quote-reply"
                rows={3}
                className="form-control mb-2"
                value={quoteReply}
                onChange={(event) => setQuoteReply(event.target.value)}
                placeholder="Cement 50 bags, delivery included. Price valid for 7 days."
              />
              {quoteLink ? (
                <p className="mb-2 text-secondary">
                  Customer link:{" "}
                  <a href={quoteLink} target="_blank" rel="noopener noreferrer">
                    {quoteLink}
                  </a>
                </p>
              ) : null}
            </>
          ) : null}

          <label htmlFor="enquiry-notes" className="form-label">Internal notes</label>
          <textarea
            id="enquiry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Follow-up notes (not shown to the customer)"
            className="form-control mb-2"
          />
          {error ? <p role="alert" className="text-danger mb-2">{error}</p> : null}
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
