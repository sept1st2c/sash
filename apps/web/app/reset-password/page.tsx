"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { resetAdminPassword } from "./actions";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await resetAdminPassword(email, code, newPassword);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // Success!
        router.push("/login?reset=success");
      }
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
        className="w-full max-w-[400px] rounded-[var(--wise-radius-xl)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas-soft)] p-10 shadow-2xl"
      >
        <Link
          href="/"
          className="mb-2 block text-center text-[15px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]"
        >
          S<span className="text-[color:var(--wise-primary)]">ash</span>
        </Link>

        <div className="mb-2 text-center text-[26px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]">
          Check your email
        </div>
        <p className="mb-8 break-words text-center text-sm text-[color:var(--wise-body)]">
          We sent a 6-digit code to <strong className="text-[color:var(--wise-ink)]">{email}</strong>
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
              htmlFor="reset-code"
            >
              6-digit code
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 text-center font-mono text-[14px] tracking-[0.5em] text-[color:var(--wise-ink)] transition-all placeholder:text-[color:var(--wise-mute)] focus:border-[color:var(--wise-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(159,232,112,0.15)]"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-[13px] font-medium text-[color:var(--wise-body)]"
              htmlFor="reset-password"
            >
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              className="w-full rounded-[var(--wise-radius-md)] border border-[color:var(--wise-border)] bg-[color:var(--wise-canvas)] px-3.5 py-2.5 text-[14px] text-[color:var(--wise-ink)] transition-all placeholder:text-[color:var(--wise-mute)] focus:border-[color:var(--wise-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(159,232,112,0.15)]"
              placeholder="Must be at least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] px-4 py-2.5 text-[14px] font-semibold text-[color:var(--wise-on-primary)] transition-colors hover:bg-[color:var(--wise-primary-active)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading || code.length !== 6 || newPassword.length < 8}
          >
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
