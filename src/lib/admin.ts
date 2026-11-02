import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireAdmin(): Promise<{ ok: boolean; status: number }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { ok: false, status: 401 };
    const allowed = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length === 0) {
      // If no admin emails configured, allow any authenticated user (dev).
      return { ok: true, status: 200 };
    }
    if (!allowed.includes((session.user.email ?? "").toLowerCase())) {
      return { ok: false, status: 403 };
    }
    return { ok: true, status: 200 };
  } catch {
    return { ok: false, status: 401 };
  }
}