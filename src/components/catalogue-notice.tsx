import Link from "next/link";
import { DatabaseZap, PackageOpen } from "lucide-react";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isSanityConfigured } from "@/lib/sanity";

type CatalogueNoticeProps = {
  /** True when the CMS is configured but there are no published products yet. */
  empty?: boolean;
  title?: string;
  /** Hides the "view brands" link where it would point at the current page. */
  showBrandsLink?: boolean;
  className?: string;
};

/**
 * Honest setup / empty state. It never fabricates products to fill the page.
 */
export async function CatalogueNotice({
  empty = false,
  title,
  showBrandsLink = true,
  className = "",
}: CatalogueNoticeProps) {
  const locale = await getLocale();
  const configured = isSanityConfigured;
  const Icon = empty || configured ? PackageOpen : DatabaseZap;

  return (
    <section
      className={`rounded-2xl border border-line bg-white shadow-sm p-6 sm:p-8 ${className}`}
      aria-labelledby="catalogue-notice-title"
    >
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-paper-deep text-link">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="catalogue-notice-title" className="text-lg font-bold tracking-tight text-ink">
            {title ||
              (empty ? translate(locale, "setupEmptyTitle") : translate(locale, "setupTitle"))}
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-soft">
            {empty ? translate(locale, "setupEmptyBody") : translate(locale, "setupBody")}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {showBrandsLink ? (
              <Link
                href="/brands"
                className="btn-ghost inline-flex min-h-11 items-center"
              >
                {translate(locale, "viewBrands")}
              </Link>
            ) : null}
            <Link
              href="/enquiry"
              className="btn-primary inline-flex min-h-11 items-center"
            >
              {translate(locale, "openEnquiryList")}
            </Link>
          </div>

          {!configured ? (
            <details className="mt-6 rounded-xl border border-line bg-paper-deep p-4 text-sm text-ink-soft">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-ink">
                {translate(locale, "setupStaff")}
              </summary>
              <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed">
                <li>{translate(locale, "setupStep1")}</li>
                <li>{translate(locale, "setupStep2")}</li>
                <li>
                  {translate(locale, "setupStep3")}{" "}
                  <Link href="/studio" className="font-semibold text-link underline">
                    /studio
                  </Link>
                </li>
                <li>{translate(locale, "setupStep4")}</li>
              </ol>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
