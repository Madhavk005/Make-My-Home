"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  allowPublicSignUp: boolean;
};

export function AuthForm({ mode, allowPublicSignUp }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: "/account",
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
            callbackURL: "/account",
          });

      if (result.error) {
        setError(result.error.message || "Authentication failed. Please try again.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        {isSignUp ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {isSignUp
          ? "Create an account to manage your Make My Home enquiries."
          : "Sign in to access your account."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink">
              Full name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 w-full rounded-lg border border-line px-3 text-base text-ink outline-none focus:border-accent"
          />
          {isSignUp && (
            <p className="mt-1 text-xs text-ink-soft">Use at least 8 characters.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary inline-flex min-h-12 w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {isSignUp ? "Already have an account?" : "New to Make My Home?"}{" "}
        {isSignUp || allowPublicSignUp ? (
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="font-semibold text-accent underline underline-offset-4"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </Link>
        ) : (
          <span>Ask the shop to create an account for you.</span>
        )}
      </p>
    </section>
  );
}