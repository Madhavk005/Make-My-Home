"use client";

import { useState } from "react";

export function AdminProductEdit({ id, initial }: { id: string; initial: { price?: number | null; availability?: string; featured?: boolean } }) {
  const [price, setPrice] = useState(initial.price ?? "");
  const [availability, setAvailability] = useState(initial.availability ?? "not_confirmed");
  const [featured, setFeatured] = useState(Boolean(initial.featured));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: price === "" ? undefined : Number(price),
          availability,
          featured,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed");
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Availability</label>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="form-select">
            <option value="available">Available</option>
            <option value="on_request">On request</option>
            <option value="unavailable">Unavailable</option>
            <option value="not_confirmed">Not confirmed</option>
          </select>
        </div>
        <div className="mb-3 form-check">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="form-check-input" id="featured" />
          <label className="form-check-label" htmlFor="featured">
            Featured on homepage
          </label>
        </div>
        <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message ? <p className="mt-2 text-secondary">{message}</p> : null}
      </div>
    </div>
  );
}