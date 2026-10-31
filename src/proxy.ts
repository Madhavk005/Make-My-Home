import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

function passthrough() {
  return NextResponse.next();
}

/**
 * Customer auth is optional. When Clerk keys are absent the proxy is a no-op so
 * the catalogue works without accounts. Sanity Studio keeps its own auth and is
 * excluded from this proxy.
 */
export default clerkEnabled ? clerkMiddleware() : passthrough;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|studio|api).*)"],
};
