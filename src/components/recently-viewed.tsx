"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { materialArt } from "@/lib/material-art";
import { ProductImage } from "./product-image";
import type { ProductCardData } from "@/lib/types";

const STORAGE_KEY = "make-my-home-recently-viewed-v1";

function readSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

function writeSlugs(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs.slice(0, 12)));
  } catch {
    // ignore
  }
}

export function recordRecentlyViewed(slug: string) {
  if (!slug || typeof window === "undefined") return;
  const next = [slug, ...readSlugs().filter((item) => item !== slug)].slice(0, 12);
  writeSlugs(next);
}

export function RecentlyViewed({ currentSlug }: { currentSlug?: string }) {
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    if (currentSlug) recordRecentlyViewed(currentSlug);
    const slugs = readSlugs().filter((slug) => slug !== currentSlug);
    if (slugs.length === 0) return;
    fetch(`/api/products/recent?slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]));
  }, [currentSlug]);

  if (products.length === 0) return null;

  return (
    <section className="mt-14 border-t border-line pt-10">
      <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
        Recently viewed
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product._id}>
            <Link href={`/product/${encodeURIComponent(product.slug)}`} className="group block">
              <div className="media-frame relative">
                <ProductImage
                  src={null}
                  fallbackSrc={materialArt(product.category?.slug, product.category?.name, product.name)}
                  alt={product.name}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="aspect-[4/5] w-full"
                  compact
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-ink group-hover:text-primary-deep">
                {product.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}