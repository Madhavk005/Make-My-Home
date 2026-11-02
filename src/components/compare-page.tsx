"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatINR, priceDisplay } from "@/lib/format";
import type { ProductDetail } from "@/lib/types";
import { useCompare } from "./compare-provider";
import { ProductImage } from "./product-image";
// (imageUrl is server-only; compare page uses fallback art only)
import { materialArt } from "@/lib/material-art";

export function ComparePage() {
  const { items, remove, clear, hydrated } = useCompare();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      const id = window.setTimeout(() => {
        setProducts([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setLoading(true), 0);
    fetch(`/api/products/compare?ids=${encodeURIComponent(items.join(","))}`)
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
    return () => window.clearTimeout(id);
  }, [items, hydrated]);

  if (!hydrated || loading) {
    return <p className="text-sm text-ink-soft">Loading comparison...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
          No products to compare
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Add up to 4 products using the Compare button on product cards.
        </p>
        <Link href="/search" className="btn btn-primary mt-6">
          Browse products
        </Link>
      </div>
    );
  }

  // Build spec rows union.
  const specNames = Array.from(
    new Set(products.flatMap((product) => (product.specifications ?? []).map((spec) => spec.name))),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/search" className="link-quiet">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to catalogue
        </Link>
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-10 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft transition-colors hover:text-forest"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Clear comparison
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-line bg-sand p-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                Attribute
              </th>
              {products.map((product) => (
                <th key={product._id} className="border border-line bg-surface p-3 text-left">
                  <div className="flex flex-col gap-2">
                    <Link href={`/product/${encodeURIComponent(product.slug)}`} className="block">
                      <ProductImage
                        src={null}
                        fallbackSrc={materialArt(product.category?.slug, product.category?.name, product.name)}
                        alt={product.name}
                        sizes="240px"
                        compact
                        className="aspect-[4/5] w-full"
                      />
                    </Link>
                    <span className="font-semibold text-ink">{product.name}</span>
                    <span className="text-xs text-ink-soft">{product.brand?.name}</span>
                    <button
                      type="button"
                      onClick={() => remove(product._id)}
                      className="text-xs text-ink-soft hover:text-forest"
                    >
                      Remove
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-line bg-sand p-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                Price
              </td>
              {products.map((product) => {
                const display = priceDisplay(
                  { price: product.price, priceStatus: product.priceStatus, unit: product.unit },
                  "en",
                );
                return (
                  <td key={product._id} className="border border-line p-3 font-semibold text-ink">
                    {display.primary}
                    {display.suffix ? ` ${display.suffix}` : ""}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="border border-line bg-sand p-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                Unit
              </td>
              {products.map((product) => (
                <td key={product._id} className="border border-line p-3 text-ink">
                  {product.unit}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-line bg-sand p-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                Availability
              </td>
              {products.map((product) => (
                <td key={product._id} className="border border-line p-3 text-ink">
                  {product.availability}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-line bg-sand p-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                SKU
              </td>
              {products.map((product) => (
                <td key={product._id} className="border border-line p-3 font-mono text-xs text-ink">
                  {product.sku}
                </td>
              ))}
            </tr>
            {specNames.map((name) => (
              <tr key={name}>
                <td className="border border-line bg-sand p-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                  {name}
                </td>
                {products.map((product) => {
                  const spec = (product.specifications ?? []).find((item) => item.name === name);
                  return (
                    <td key={product._id} className="border border-line p-3 text-ink">
                      {spec?.value ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}