"use client";

import { useState } from "react";
import Link from "next/link";
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
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-grid bg-[color:var(--color-bg-base)]">
      <div className="w-full max-w-[400px] bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-3xl p-10 backdrop-blur-sm shadow-2xl relative">
        <Link href="/login" className="absolute top-6 left-6 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        
        <div className="text-center text-[26px] font-extrabold tracking-tight mb-2 mt-4">
          Reset Password
        </div>
        <p className="text-center text-sm text-[color:var(--color-text-secondary)] mb-8">
          Enter your email to receive a reset code
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-lg text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-[color:var(--color-text-secondary)] mb-1.5" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="w-full px-3.5 py-2.5 bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border-subtle)] rounded-xl text-[14px] text-[color:var(--color-text-primary)] transition-all focus:outline-none focus:border-[color:var(--color-brand)] focus:ring-4 focus:ring-brand/20 placeholder:text-[color:var(--color-text-muted)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-[color:var(--color-brand-light)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>
      </div>
    </div>
  );
}
