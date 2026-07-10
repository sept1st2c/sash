"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
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
          Create your developer account
        </p>

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
              htmlFor="reg-email"
            >
              Email
            </label>
            <input
              id="reg-email"
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
            <label
              className="mb-1.5 block text-[13px] font-medium text-[color:var(--wise-body)]"
              htmlFor="reg-password"
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className="w-full rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 text-[14px] text-[color:var(--wise-ink)] transition-all placeholder:text-[color:var(--wise-mute)] focus:border-[color:var(--wise-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(159,232,112,0.15)]"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] px-4 py-2.5 text-[14px] font-semibold text-[color:var(--wise-on-primary)] transition-colors hover:bg-[color:var(--wise-primary-active)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="my-6 h-px bg-[color:var(--wise-border)]" />

        <p className="text-center text-[14px] text-[color:var(--wise-body)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[color:var(--wise-primary)] underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
