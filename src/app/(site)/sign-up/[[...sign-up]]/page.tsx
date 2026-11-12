import type { Metadata } from "next";
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
  return (
    <div className="flex justify-center px-4 py-12">
      <AuthForm mode="sign-up" allowPublicSignUp />
    </div>
  );
}
