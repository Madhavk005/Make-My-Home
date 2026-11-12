import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Admin access is allowlist-only. An empty allowlist must never mean "allow
 * everyone" — that turns any public sign-up into an admin account.
 */
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL?.trim().toLowerCase() || null;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (adminEmails.size === 0) return false;
  return adminEmails.has(email.trim().toLowerCase());
}

/** Main-admin operations (payment changes, user access and destructive CRM actions)
 * require this explicit owner identity in addition to a valid signed-in session. */
export function isMainAdminEmail(email: string | null | undefined): boolean {
  return Boolean(mainAdminEmail && email && mainAdminEmail === email.trim().toLowerCase());
}

export async function getAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return null;
  }

  if (!isAdminEmail(session.user.email) && !isMainAdminEmail(session.user.email)) {
    return null;
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

/**
 * Route-handler variant of `requireAdmin`. Returns a JSON-friendly status
 * instead of redirecting, so API clients never receive an HTML login page.
 */
export async function getAdminApiSession(): Promise<
  | { session: Awaited<ReturnType<typeof auth.api.getSession>>; status: 200 }
  | { session: null; status: 401 | 403 }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return { session: null, status: 401 };
  }

  if (!isAdminEmail(session.user.email) && !isMainAdminEmail(session.user.email)) {
    return { session: null, status: 403 };
  }

  return { session, status: 200 };
}
