import Link from "next/link";
import { Compass } from "lucide-react";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default async function SiteNotFound() {
  const locale = await getLocale();

  return (
    <div className="container section text-center">
      <Breadcrumbs items={[{ label: translate(locale, "notFoundTitle") }]} />
      <div className="mt-8 mx-auto rounded-xl border border-line bg-white shadow-sm p-8 sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-line bg-paper-deep text-link">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-semibold text-ink-soft">
          {translate(locale, "notFound404")}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {translate(locale, "notFoundTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-soft">
          {translate(locale, "notFoundBody")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/search"
            className="btn-primary inline-flex min-h-12 items-center justify-center"
          >
            {translate(locale, "searchCatalogue")}
          </Link>
          <Link
            href="/"
            className="btn-secondary inline-flex min-h-12 items-center justify-center"
          >
            {translate(locale, "goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
