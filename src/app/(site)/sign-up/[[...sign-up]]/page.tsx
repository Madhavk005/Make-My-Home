import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "createAccount"),
    robots: { index: false, follow: false },
  };
}

export default async function SignUpPage() {
  const locale = await getLocale();

  if (!clerkEnabled) {
    return (
      <div className="container section-compact text-center">
        <h1 className="text-xl font-bold tracking-tight text-ink">
          {translate(locale, "accountDisabledTitle")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">
          {translate(locale, "accountDisabledBody")}
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-6 text-sm font-semibold text-paper transition-colors hover:bg-accent"
        >
          {translate(locale, "browseCatalogue")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
