"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { AdminProductEdit } from "@/components/admin-product-edit";

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [initial, setInitial] = useState<{ price?: number | null; availability?: string; featured?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const resolved = await params;
      setId(resolved.id);
      const response = await fetch(`/api/admin/products/${resolved.id}`);
      const data = await response.json();
      if (response.ok) {
        setInitial({ price: data.price, availability: data.availability, featured: data.featured });
      }
      setLoading(false);
    })();
  }, [params]);

  if (loading) return <p className="text-secondary">Loading...</p>;
  if (!initial) return <p className="text-secondary">Product not found or Sanity not configured.</p>;

  return (
    <>
      <PageHeader title="Edit product" />
      <AdminProductEdit id={id} initial={initial} />
    </>
  );
}