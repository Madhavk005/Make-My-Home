"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { useLocale } from "./locale-provider";

type ProductImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Hides the placeholder caption on very small thumbnails. */
  compact?: boolean;
  /**
   * Local material illustration shown when no photograph exists. It is labelled
   * as a material study, never presented as the real product.
   */
  fallbackSrc?: string | null;
  fallbackLabel?: string;
};

/**
 * Renders a real product image, or an honest placeholder when the business has
 * not supplied one. Failed image requests also fall back to the placeholder so
 * a slow or blocked connection never leaves a blank product card.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  compact = false,
  fallbackSrc,
  fallbackLabel,
}: ProductImageProps) {
  const { t } = useLocale();
  // Remember which src failed instead of resetting a boolean in an effect, so
  // a new image starts fresh without a cascading render.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const failed = Boolean(src) && failedSrc === src;
  const showPlaceholder = !src || failed;
  const message = failed ? t("imageLoadFailed") : t("imageNotSupplied");

  if (showPlaceholder && fallbackSrc) {
    return (
      <div className={`relative overflow-hidden bg-sand ${className}`}>
        <Image
          src={fallbackSrc}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          aria-hidden="true"
        />
        <span className="absolute bottom-2 left-2 rounded-full border border-ink/10 bg-canvas/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft backdrop-blur-sm">
          {fallbackLabel || (compact ? t("materialStudyShort") : t("materialStudy"))}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {showPlaceholder ? (
        <div
          className="diagonal-hatch flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center"
          role="img"
          aria-label={`${alt} — ${message}`}
        >
          <ImageOff
            className={`${compact ? "h-6 w-6" : "h-8 w-8"} text-ink-faint/60`}
            aria-hidden="true"
          />
          {compact ? null : (
            <span className="text-sm font-semibold text-ink-soft">{message}</span>
          )}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={72}
          onError={() => setFailedSrc(src)}
          className="object-cover"
        />
      )}
    </div>
  );
}
