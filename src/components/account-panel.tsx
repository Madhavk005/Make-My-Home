"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AccountPanel({ allowPublicSignUp }: { allowPublicSignUp: boolean }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  if (isPending) {
    return <p className="text-sm text-ink-soft">Loading your account...</p>;
  }

  if (!session) {
    return (
      <section className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-ink">Sign in to your account</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          Signing in is optional. You can still browse products and contact us on WhatsApp.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/sign-in" className="btn-primary inline-flex min-h-12 items-center">
            Sign in
          </Link>
          {allowPublicSignUp ? (
            <Link href="/sign-up" className="btn-secondary inline-flex min-h-12 items-center">
              Create account
            </Link>
          ) : null}
          <Link href="/enquiry" className="btn-secondary inline-flex min-h-12 items-center">
            View enquiry list
          </Link>
        </div>
      </section>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setSignOutError(result.error.message || "Could not sign out. Please try again.");
        return;
      }
      router.replace("/");
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-ink">Your account</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-ink-soft">Name</dt>
          <dd className="font-semibold text-ink">{session.user.name || "Customer"}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Email</dt>
          <dd className="font-semibold text-ink">{session.user.email}</dd>
        </div>
      </dl>
      {signOutError ? (
        <p role="alert" className="mt-4 text-sm text-danger">{signOutError}</p>
      ) : null}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="btn-secondary mt-6 inline-flex min-h-12 items-center disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </section>
  );
}