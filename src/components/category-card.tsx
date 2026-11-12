import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryHref } from "@/lib/categories";
import { imageUrl } from "@/lib/image";
import { productCountLabel, subCategoryCountLabel } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { materialArt } from "@/lib/material-art";
import type { CategoryNode } from "@/lib/types";
import { ProductImage } from "./product-image";

export async function CategoryCard({
  category,
  featured = false,
  className = "",
}: {
  category: CategoryNode;
  featured?: boolean;
  className?: string;
}) {
  const locale = await getLocale();
  const src = imageUrl(category.image, {
    width: featured ? 900 : 640,
    height: featured ? 1120 : 800,
  });

  return (
    <Link
      href={categoryHref(category.path)}
      className={`group flex h-full flex-col ${className}`}
    >
      <div className="media-frame relative flex-1">
        <ProductImage
          src={src}
          fallbackSrc={materialArt(category.slug, category.name)}
          alt={category.image?.alt?.trim() || category.name}
          sizes={
            featured
              ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
          }
          className={featured ? "aspect-[4/5] w-full" : "aspect-[4/5] w-full"}
          priority={featured}
        />
        <span className="absolute left-3 top-3 rounded-full border border-surface/40 bg-canvas/90 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-ink backdrop-blur-sm">
          {productCountLabel(category.productCount, locale)}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-primary-deep/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="min-w-0">
          <h3
            className={`font-display font-medium leading-tight tracking-[-0.015em] text-ink transition-colors group-hover:text-primary-deep ${
              featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
            }`}
          >
            {category.name}
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            {category.children.length > 0
              ? subCategoryCountLabel(category.children.length, locale)
              : category.description || productCountLabel(category.productCount, locale)}
          </p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-colors group-hover:border-primary group-hover:bg-accent group-hover:text-charcoal">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
