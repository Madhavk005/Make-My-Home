"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Sign in failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen-dvh items-center justify-center bg-canvas px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
      >
        <div className="mb-5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
              <path d="M9 21v-6h6v6" stroke="#F5A623" />
            </svg>
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-ink">Make My Home</h1>
            <p className="text-xs font-semibold text-ink-soft">Admin sign in</p>
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="admin-email" className="label !mb-1.5">Email</label>
            <input
              id="admin-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label !mb-1.5">Password</label>
            <input
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="btn btn-primary mt-5 w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
