import type { Metadata } from "next";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserProfile } from "@clerk/nextjs";
import { UserRound } from "lucide-react";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { Breadcrumbs } from "@/components/breadcrumbs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "accountTitle"),
    description: translate(locale, "accountIntro"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage() {
  const locale = await getLocale();

  return (
    <div className="container section-compact">
      <Breadcrumbs items={[{ label: translate(locale, "account") }]} />

      <header className="page-header mb-8">
        <p className="page-header-kicker">{translate(locale, "account")}</p>
        <h1 className="page-header-title">{translate(locale, "accountTitle")}</h1>
        <p className="page-header-desc">{translate(locale, "accountIntro")}</p>
      </header>

      {!clerkEnabled ? (
        <section className="rounded-xl border border-line bg-white shadow-sm p-6 sm:p-8">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-paper-deep text-accent">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">
            {translate(locale, "accountDisabledTitle")}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-ink-soft">
            {translate(locale, "accountDisabledBody")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="btn-primary inline-flex min-h-12 items-center"
            >
              {translate(locale, "browseCatalogue")}
            </Link>
            <Link
              href="/enquiry"
              className="btn-secondary inline-flex min-h-12 items-center"
            >
              {translate(locale, "openEnquiryList")}
            </Link>
          </div>
        </section>
      ) : (
        <div className="mt-8">
          <SignedOut>
            <section className="rounded-xl border border-line bg-white shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {translate(locale, "signIn")}
              </h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-soft">
                {translate(locale, "signInOptional")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="btn-primary inline-flex min-h-12 items-center"
                  >
                    {translate(locale, "signIn")}
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="btn-secondary inline-flex min-h-12 items-center"
                  >
                    {translate(locale, "createAccount")}
                  </button>
                </SignUpButton>
              </div>
            </section>
          </SignedOut>
          <SignedIn>
            <UserProfile routing="hash" />
          </SignedIn>
        </div>
      )}
    </div>
  );
}
