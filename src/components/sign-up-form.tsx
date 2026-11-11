"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await signUp.email({ name, email, password });
      if (err) {
        setError(err.message || "Sign up failed");
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-ink">Create an account</h1>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div>
          <label className="block text-sm font-medium text-ink">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ink px-6 py-2 text-sm font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-link hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}