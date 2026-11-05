import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { translate } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: translate(locale, "createAccount"),
    robots: { index: false, follow: false },
  };
}

export default function SignUpPage() {
  const allowPublicSignUp = process.env.ALLOW_PUBLIC_SIGNUP === "true";
  // Public registration is opt-in. Admin access is allowlist-only, so open
  // sign-up is not needed for normal storefront use.
  if (!allowPublicSignUp) {
    redirect("/sign-in");
  }

  return (
    <div className="flex justify-center px-4 py-12">
      <AuthForm mode="sign-up" allowPublicSignUp={allowPublicSignUp} />
    </div>
  );
}
