"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

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
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--wise-canvas)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] rounded-[var(--wise-radius-xl)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas-soft)] p-10 shadow-2xl"
      >
        <Link
          href="/"
          className="mb-2 block text-center text-[26px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]"
        >
          S<span className="text-[color:var(--wise-primary)]">ash</span>
        </Link>
        <p className="mb-8 text-center text-sm text-[color:var(--wise-body)]">
          Sign in to your dashboard
        </p>

        {registered && (
          <div
            className="mb-5 rounded-[var(--wise-radius-md)] border p-3 text-sm font-medium"
            style={{
              backgroundColor: "rgba(159,232,112,0.12)",
              borderColor: "var(--wise-border)",
              color: "var(--wise-positive-deep)",
            }}
          >
            Your account is ready. Sign in below.
          </div>
        )}

        {error && (
          <div
            className="mb-5 rounded-[var(--wise-radius-md)] border p-3 text-sm font-medium"
            style={{
              backgroundColor: "var(--wise-negative-bg)",
              borderColor: "rgba(255,122,122,0.3)",
              color: "var(--wise-negative)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="mb-1.5 block text-[13px] font-medium text-[color:var(--wise-body)]"
              htmlFor="login-email"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="w-full rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 text-[14px] text-[color:var(--wise-ink)] transition-all placeholder:text-[color:var(--wise-mute)] focus:border-[color:var(--wise-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(159,232,112,0.15)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                className="block text-[13px] font-medium text-[color:var(--wise-body)]"
                htmlFor="login-password"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-[color:var(--wise-primary)] underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="w-full rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 text-[14px] text-[color:var(--wise-ink)] transition-all placeholder:text-[color:var(--wise-mute)] focus:border-[color:var(--wise-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(159,232,112,0.15)]"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] px-4 py-2.5 text-[14px] font-semibold text-[color:var(--wise-on-primary)] transition-colors hover:bg-[color:var(--wise-primary-active)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="my-6 h-px bg-[color:var(--wise-border)]" />

        <p className="text-center text-[14px] text-[color:var(--wise-body)]">
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-[color:var(--wise-primary)] underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
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
