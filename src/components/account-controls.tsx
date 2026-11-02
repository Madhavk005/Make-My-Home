"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "./locale-provider";

export function AccountControls() {
  const { t } = useLocale();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  return (
    <div className="flex items-center gap-2">
      {session ? (
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center rounded-md px-2.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          {session.user.name || t("account")}
        </Link>
      ) : (
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-md px-2.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          {t("signIn")}
        </Link>
      )}
    </div>
  );
}