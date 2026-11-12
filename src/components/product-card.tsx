import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { availabilityMeta } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import { materialArt } from "@/lib/material-art";
import type { ProductCardData } from "@/lib/types";
import { PriceTag } from "./price-tag";
import { ProductImage } from "./product-image";
import { QuickAdd } from "./quick-add";
import { CompareToggle } from "./compare-toggle";

export async function ProductCard({ product }: { product: ProductCardData }) {
  const locale = await getLocale();
  const href = `/product/${encodeURIComponent(product.slug)}`;
  const src = imageUrl(product.image, { width: 720, height: 900 });
  const availability = availabilityMeta(product.availability, locale);
  const variantCount = product.variantCount ?? 0;
  const specs = (product.specSummary ?? []).slice(0, 2);

  return (
    <article className="group flex h-full flex-col">
      <div className="relative">
        <Link href={href} className="block focus-visible:outline-offset-4" tabIndex={-1}>
          <div className="media-frame relative">
            <ProductImage
              src={src}
              fallbackSrc={materialArt(
                product.category?.slug,
                product.category?.name,
                product.name,
              )}
              alt={product.image?.alt?.trim() || product.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="aspect-[4/5] w-full"
              compact
            />
            <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
              {product.brand?.name ? (
                <span className="rounded-full border border-surface/50 bg-canvas/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink backdrop-blur-sm">
                  {product.brand.name}
                </span>
              ) : null}
              {product.isDemo ? (
                <span className="rounded-full border border-primary/40 bg-accent-soft/95 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-dark backdrop-blur-sm">
                  {translate(locale, "demo")}
                </span>
              ) : null}
            </div>
            {product.featured ? (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-surface backdrop-blur-sm">
                {translate(locale, "homeFeaturedKicker")}
              </span>
            ) : null}
          </div>
        </Link>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={href} className="line-clamp-2 transition-colors hover:text-primary-deep">
              {product.name}
            </Link>
          </h3>
          <ArrowUpRight
            className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-primary-deep"
            aria-hidden="true"
          />
        </div>

        {specs.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {specs.map((spec) => (
              <li
                key={`${spec.name}-${spec.value}`}
                className="rounded-full border border-line-soft bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft"
              >
                {spec.name}: {spec.value}
              </li>
            ))}
          </ul>
        ) : product.shortDescription ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <PriceTag
              price={product.price}
              priceStatus={product.priceStatus}
              unit={product.unit}
              fromPrice={product.fromPrice}
              variantCount={variantCount}
            />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
              <span
                className={`h-1.5 w-1.5 rounded-full ${availability.dotClass}`}
                aria-hidden="true"
              />
              {availability.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line-soft pt-3">
            <Link
              href={href}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xs border border-line bg-surface px-2 text-xs font-bold text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
            >
              {translate(locale, "viewDetails")}
            </Link>
            {variantCount === 0 ? (
              <QuickAdd
                item={{
                  key: `${product._id}::default`,
                  productId: product._id,
                  slug: product.slug,
                  name: product.name,
                  brand: product.brand?.name ?? null,
                  sku: product.sku,
                  price: product.price ?? null,
                  priceStatus: product.priceStatus,
                  unit: product.unit,
                  availability: product.availability,
                  imageUrl: src,
                }}
                className="shrink-0 !min-h-10 !rounded-xs !px-2.5 !text-xs"
              />
            ) : null}
            <CompareToggle productId={product._id} />
          </div>
        </div>
      </div>
    </article>
  );
}
