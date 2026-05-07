"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-grid bg-[color:var(--color-bg-base)]">
      <div className="w-full max-w-[400px] bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-3xl p-10 backdrop-blur-sm shadow-2xl">
        <div className="text-center text-[26px] font-extrabold tracking-tight mb-2">
          Check your email
        </div>
        <p className="text-center text-sm text-[color:var(--color-text-secondary)] mb-8">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="reset-code">
              6-Digit Code
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)] text-center tracking-[0.5em] font-mono"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="reset-password">
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)]"
              placeholder="Must be at least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-[color:var(--color-brand-light)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || code.length !== 6 || newPassword.length < 8}
          >
            {loading ? "Saving..." : "Save New Password"}
          </button>
        </form>
      </div>
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
