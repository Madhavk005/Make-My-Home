import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  PackageCheck,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  getCatalogue,
  getProductBySlug,
  getRelatedProducts,
  getSiteSettings,
} from "@/lib/catalogue";
import { categoryBreadcrumb, descendantIds } from "@/lib/categories";
import { formatINR } from "@/lib/format";
import { translate, unitLabel } from "@/lib/i18n";
import { imageUrl } from "@/lib/image";
import { getLocale } from "@/lib/locale";
import { getSettingWhatsAppNumber, localizedSetting } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { materialArt } from "@/lib/material-art";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { RecentlyViewed } from "@/components/recently-viewed";
import { RichText } from "@/components/rich-text";
import type { Specification } from "@/lib/types";

type PageParams = PageProps<"/product/[slug]">;

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([props.params, getLocale()]);
  const product = await getProductBySlug(slug);
  if (!product) return { title: translate(locale, "notFoundTitle") };

  const image = imageUrl(product.images?.[0], { width: 1200, height: 630 });

  return {
    title: product.name,
    description:
      product.shortDescription?.trim() ||
      `${product.name}${product.brand?.name ? ` — ${product.brand.name}` : ""}. ${translate(
        locale,
        "priceNoteDefault",
      )}`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: image ? { images: [{ url: image, alt: product.name }] } : undefined,
  };
}

function groupSpecifications(specifications: Specification[] | null | undefined) {
  const groups = new Map<string, Array<{ name: string; value: string }>>();
  for (const spec of specifications ?? []) {
    if (!spec.name || !spec.value) continue;
    const key = spec.group?.trim() || "Specifications";
    const list = groups.get(key) ?? [];
    list.push({ name: spec.name, value: spec.value });
    groups.set(key, list);
  }
  return Array.from(groups.entries());
}

export default async function ProductPage(props: PageParams) {
  const [{ slug }, locale] = await Promise.all([props.params, getLocale()]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, catalogue] = await Promise.all([
    getSiteSettings().catch(() => null),
    getCatalogue(),
  ]);
  const priceNote = localizedSetting(settings, "priceNote", locale);

  const categoryCrumbs = product.category?._id
    ? categoryBreadcrumb(catalogue.categories, product.category._id)
    : [];
  const topCategory = categoryCrumbs[0];
  const relatedCategoryIds = topCategory
    ? descendantIds(catalogue.categories, topCategory._id)
    : undefined;

  const related = product.category?._id
    ? await getRelatedProducts(
        product.category._id,
        product.slug,
        relatedCategoryIds,
      )
    : [];

  const galleryImages = (product.images ?? [])
    .map((image) => ({
      url: imageUrl(image, { width: 1400, height: 1400 }),
      alt: image.alt?.trim() || product.name,
    }))
    .filter((image): image is { url: string; alt: string } => Boolean(image.url));

  const specGroups = groupSpecifications(product.specifications);
  const primaryImageUrl = galleryImages[0]?.url ?? null;
  const fallbackArt = materialArt(
    product.name,
    product.category?.name,
    product.brand?.name,
    product.keywords?.join(" "),
  );
  const hasListPrice =
    typeof product.originalPrice === "number" &&
    product.originalPrice > 0 &&
    typeof product.price === "number" &&
    product.price > 0 &&
    product.originalPrice > product.price;

  const whatsappNumber = getSettingWhatsAppNumber(settings);
  const phone = settings?.phone?.trim() || null;
  const businessName = settings?.businessName?.trim() || "Make My Home";
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    translate(locale, "whatsappMessageGeneric", { business: businessName }),
  );

  const categoryPath = categoryCrumbs.at(-1)?.path ?? null;
  const categoryHref = categoryPath
    ? `/category/${categoryPath.map(encodeURIComponent).join("/")}`
    : "/categories";
  const crumbs = [
    ...categoryCrumbs.map((node) => ({
      label: node.name,
      href: `/category/${node.path.map(encodeURIComponent).join("/")}`,
    })),
    { label: product.name },
  ];

  const backHref = categoryPath
    ? `/category/${categoryPath.map(encodeURIComponent).join("/")}`
    : "/search";
  const backLabel = categoryCrumbs.at(-1)?.name ?? translate(locale, "allProducts");

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.name,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    image: galleryImages.map((image) => image.url).filter(Boolean),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: typeof product.price === "number" ? product.price : undefined,
      availability:
        product.availability === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/product/${product.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item:
        "href" in crumb && crumb.href
          ? `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${crumb.href}`
          : undefined,
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="border-b border-line bg-sand/35">
        <div className="container">
          <Breadcrumbs items={crumbs} className="pt-2" />
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <Link href={backHref} className="link-quiet">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {translate(locale, "back")} · {backLabel}
            </Link>
            {product.category?.name ? (
              <Link
                href={categoryHref}
                className="hidden items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-primary-deep sm:inline-flex"
              >
                {translate(locale, "viewCategory")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container section-sm">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 xl:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery
              images={galleryImages}
              name={product.name}
              fallbackSrc={fallbackArt}
            />
            <div className="mt-4 grid grid-cols-2 gap-px border border-line bg-line text-center">
              <div className="bg-surface px-3 py-3">
                <p className="font-display text-lg leading-none text-ink">
                  {product.variants?.length
                    ? product.variants.length
                    : unitLabel(product.unit, locale)}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {product.variants?.length
                    ? translate(locale, "variants")
                    : translate(locale, "unit")}
                </p>
              </div>
              <div className="bg-surface px-3 py-3">
                <p className="font-display text-lg leading-none text-ink">
                  {specGroups.reduce((total, [, specs]) => total + specs.length, 0)}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {translate(locale, "specifications")}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {product.brand ? (
                <Link
                  href={`/brands/${encodeURIComponent(product.brand.slug)}`}
                  className="inline-flex min-h-9 items-center text-xs font-bold uppercase tracking-[0.12em] text-primary-deep transition-colors hover:text-primary-deep"
                >
                  {product.brand.name}
                </Link>
              ) : (
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {businessName}
                </span>
              )}
              {product.isDemo ? (
                <span className="badge badge-accent">{translate(locale, "demo")}</span>
              ) : null}
            </div>

            <h1 className="type-h1 mt-3 text-balance text-ink">{product.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
              <p>
                {translate(locale, "sku")}:{" "}
                <span className="font-mono text-ink">{product.sku}</span>
              </p>
              {product.category?.name ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-ink-faint" aria-hidden="true" />
                  <p>
                    {translate(locale, "category")}:{" "}
                    <Link
                      href={categoryHref}
                      className="font-semibold text-ink underline-offset-2 hover:text-primary-deep hover:underline"
                    >
                      {product.category.name}
                    </Link>
                  </p>
                </>
              ) : null}
            </div>

            {product.shortDescription ? (
              <p className="type-lead mt-5 max-w-xl text-pretty">{product.shortDescription}</p>
            ) : null}

            {hasListPrice ? (
              <p className="mt-3 text-sm text-ink-soft">
                {translate(locale, "businessListedPrice", {
                  price: formatINR(product.originalPrice as number),
                })}
              </p>
            ) : null}

            <ProductPurchasePanel
              product={{
                id: product._id,
                name: product.name,
                slug: product.slug,
                brand: product.brand?.name ?? null,
                sku: product.sku,
                price: product.price ?? null,
                priceStatus: product.priceStatus,
                unit: product.unit,
                availability: product.availability,
                imageUrl: primaryImageUrl,
              }}
              variants={(product.variants ?? []).map((variant) => ({
                label: variant.label,
                sku: variant.sku ?? null,
                attributes: variant.attributes ?? [],
                price: variant.price ?? null,
                priceStatus: variant.priceStatus ?? product.priceStatus,
                unit: variant.unit || product.unit,
                availability: variant.availability ?? product.availability,
                imageUrl: imageUrl(variant.image, { width: 800, height: 800 }),
              }))}
              whatsappNumber={whatsappNumber}
              phone={phone}
              businessName={settings?.businessName ?? null}
              priceNote={priceNote}
            />

            <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2">
              <div className="bg-surface p-4">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  <ShieldCheck className="h-3.5 w-3.5 text-whatsapp" aria-hidden="true" />
                  {translate(locale, "productAskTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {priceNote || translate(locale, "priceNoteDefault")}
                </p>
              </div>
              <div className="bg-surface p-4">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  <PackageCheck className="h-3.5 w-3.5 text-primary-deep" aria-hidden="true" />
                  {translate(locale, "productDeliveryTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {translate(locale, "productDeliveryBody")}
                </p>
              </div>
            </div>

            <p className="mt-6 flex items-start gap-2.5 border-l-2 border-primary pl-3 text-sm leading-relaxed text-ink-soft">
              <span>{translate(locale, "noCheckoutNote")}</span>
            </p>

            {specGroups.length > 0 ? (
              <section aria-labelledby="specifications" className="mt-10 border-t border-line pt-7">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="type-eyebrow">{translate(locale, "productKicker")}</p>
                    <h2
                      id="specifications"
                      className="mt-2 font-display text-2xl font-medium tracking-tight text-ink"
                    >
                      {translate(locale, "specifications")}
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    {String(specGroups.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="space-y-5">
                  {specGroups.map(([group, specs]) => (
                    <div key={group}>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-deep">
                        {group}
                      </h3>
                      <dl className="mt-2 divide-y divide-line border border-line bg-surface">
                        {specs.map((spec, index) => (
                          <div
                            key={`${spec.name}-${index}`}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 px-3.5 py-3 text-sm"
                          >
                            <dt className="text-ink-soft">{spec.name}</dt>
                            <dd className="font-semibold text-ink">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {product.keywords && product.keywords.length > 0 ? (
              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  {translate(locale, "searchTerms")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {product.keywords.slice(0, 12).map((keyword) => (
                    <li key={keyword}>
                      <Link
                        href={`/search?q=${encodeURIComponent(keyword)}`}
                        className="chip !min-h-8 !px-2.5 !text-[11px]"
                      >
                        {keyword}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5">
              {phone ? (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="link-quiet">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {phone}
                </a>
              ) : null}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-quiet"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {translate(locale, "whatsappAsk")}
                </a>
              ) : null}
              <Link href="/enquiry" className="link-quiet">
                {translate(locale, "reviewEnquiry")}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {product.description && product.description.length > 0 ? (
          <section aria-labelledby="description" className="mt-14 border-t border-line pt-10">
            <div className="grid gap-6 lg:grid-cols-[0.4fr_1fr] lg:gap-14">
              <div>
                <p className="type-eyebrow">{translate(locale, "aboutProduct")}</p>
                <h2
                  id="description"
                  className="mt-2 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
                >
                  {translate(locale, "aboutProduct")}
                </h2>
              </div>
              <div className="max-w-2xl">
                <RichText value={product.description} />
              </div>
            </div>
          </section>
        ) : null}

        <RecentlyViewed currentSlug={product.slug} />

        {related.length > 0 ? (
          <section aria-labelledby="related" className="mt-14 border-t border-line pt-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="type-eyebrow">{translate(locale, "sameCategory")}</p>
                <h2
                  id="related"
                  className="mt-2 font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
                >
                  {translate(locale, "relatedProducts")}
                </h2>
              </div>
              {categoryPath ? (
                <Link href={categoryHref} className="link-arrow shrink-0">
                  {translate(locale, "viewAll")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item._id}>
                  <ProductCard product={item} />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ink-soft">
              {translate(locale, "relatedShown", { count: related.length })}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
