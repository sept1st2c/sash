"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { sendAdminResetCode } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await sendAdminResetCode(email);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If success, the server action will redirect to /reset-password
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--wise-canvas)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-[400px] rounded-[var(--wise-radius-xl)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas-soft)] p-10 shadow-2xl"
      >
        <Link
          href="/login"
          className="absolute top-6 left-6 text-[color:var(--wise-mute)] transition-colors hover:text-[color:var(--wise-ink)]"
          title="Back to sign in"
        >
          <ArrowLeft size={20} />
        </Link>

        <Link
          href="/"
          className="mt-4 mb-2 block text-center text-[15px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]"
        >
          S<span className="text-[color:var(--wise-primary)]">ash</span>
        </Link>

        <div className="mb-2 text-center text-[26px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]">
          Reset your password
        </div>
        <p className="mb-8 text-center text-sm text-[color:var(--wise-body)]">
          We&apos;ll email you a reset code
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
              htmlFor="forgot-email"
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="w-full rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 text-[14px] text-[color:var(--wise-ink)] transition-all placeholder:text-[color:var(--wise-mute)] focus:border-[color:var(--wise-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(159,232,112,0.15)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] px-4 py-2.5 text-[14px] font-semibold text-[color:var(--wise-on-primary)] transition-colors hover:bg-[color:var(--wise-primary-active)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
