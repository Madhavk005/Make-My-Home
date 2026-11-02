import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { AccountPanel } from "@/components/account-panel";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

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

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-paper-deep text-accent">
        <UserRound className="h-6 w-6" aria-hidden="true" />
      </div>

      <AccountPanel />
    </div>
  );
}