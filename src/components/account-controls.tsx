"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useLocale } from "./locale-provider";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AccountControls() {
  const { t } = useLocale();

  if (!clerkEnabled) return null;

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-md px-2.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            {t("signIn")}
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </SignedIn>
    </div>
  );
}
