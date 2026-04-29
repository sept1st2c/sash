"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-grid bg-[color:var(--color-bg-base)]">
      <div className="w-full max-w-[400px] bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-3xl p-10 backdrop-blur-sm shadow-2xl">
        <div className="text-center text-[26px] font-extrabold tracking-tight mb-2">
          S<span className="text-[color:var(--color-brand)]">ash</span>
        </div>
        <p className="text-center text-sm text-[color:var(--color-text-secondary)] mb-8">
          Sign in to your dashboard
        </p>

        {registered && (
          <div className="mb-5 p-3 rounded-lg text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            Account created! Sign in below.
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)]"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-[color:var(--color-brand-light)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="h-px bg-[color:var(--color-border-subtle)] my-6" />

        <p className="text-center text-[14px] text-[color:var(--color-text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[color:var(--color-brand-light)] font-medium hover:underline decoration-brand/30 underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
