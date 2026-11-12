"use client";

import { useState } from "react";
import { ProductImage } from "./product-image";
import { useLocale } from "./locale-provider";

type GalleryImage = {
  url: string;
  alt: string;
};

export function ProductGallery({
  images,
  name,
  fallbackSrc,
}: {
  images: GalleryImage[];
  name: string;
  /** Local material illustration shown when no photograph was supplied. */
  fallbackSrc?: string | null;
}) {
  const { t } = useLocale();
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="relative border border-line bg-sand p-2.5 sm:p-3">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 z-10 h-8 w-8 border-l-2 border-t-2 border-primary"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 z-10 h-8 w-8 border-b-2 border-r-2 border-primary"
        />
        <ProductImage
          src={current?.url}
          alt={current?.alt || name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          fallbackSrc={fallbackSrc}
          className="aspect-square w-full"
        />
        <div className="flex items-center justify-between gap-3 px-1 pb-0.5 pt-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            {t("productKicker")} / {String(active + 1).padStart(2, "0")}
          </span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            {images.length > 1
              ? `${active + 1} / ${images.length}`
              : t("imageNotSupplied")}
          </span>
        </div>
      </div>

      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={t("showImage", { index: index + 1, count: images.length })}
                aria-current={index === active ? "true" : undefined}
                className={`block min-h-11 w-full overflow-hidden border p-0.5 transition-colors ${
                  index === active
                    ? "border-primary"
                    : "border-line hover:border-ink/40"
                }`}
              >
                <ProductImage
                  src={image.url}
                  alt={image.alt || `${name} ${index + 1}`}
                  sizes="120px"
                  compact
                  fallbackSrc={fallbackSrc}
                  className="aspect-square w-full"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
