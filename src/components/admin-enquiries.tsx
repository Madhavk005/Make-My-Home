"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "./admin/status-badge";

type Item = {
  productName: string;
  quantity: number;
  unit: string;
  sku?: string | null;
};

type Enquiry = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_location?: string | null;
  admin_notes?: string | null;
  status: string;
  customer_note?: string | null;
  created_at: string;
  items: Item[];
};

const STATUSES = ["all", "new", "contacted", "quoted", "converted", "cancelled"];

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/enquiries/list?status=${filter}`);
    const data = await response.json();
    setEnquiries(data.enquiries ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const filtered = enquiries.filter((enquiry) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return (
      enquiry.reference.toLowerCase().includes(needle) ||
      enquiry.customer_name.toLowerCase().includes(needle) ||
      enquiry.customer_phone.includes(needle) ||
      enquiry.items.some((item) => item.productName.toLowerCase().includes(needle))
    );
  });

  if (loading) return <p className="text-sm text-secondary">Loading...</p>;

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <a href="/api/admin/export/enquiries" className="btn btn-secondary">
          Export CSV
        </a>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference, customer, product..."
          className="form-control"
          style={{ maxWidth: 320 }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-select"
          style={{ maxWidth: 200 }}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-vcenter card-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td className="font-monospace">{enquiry.reference}</td>
                  <td>
                    {enquiry.customer_name}
                    <br />
                    <span className="text-secondary">{enquiry.customer_phone}</span>
                  </td>
                  <td>{enquiry.items.length}</td>
                  <td>
                    <StatusBadge status={enquiry.status} />
                  </td>
                  <td>{new Date(enquiry.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/enquiries/${enquiry.id}`} className="btn btn-sm btn-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}