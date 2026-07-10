"use client";

import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  SashProvider,
  useSash,
  SignIn,
  SignUp,
  ForgotPassword,
} from "@septic/sdk";

// Next.js inlines NEXT_PUBLIC_* vars at build time, so this works fine in a
// client component. Populated by running apps/web/prisma/seed-demo.ts and
// copying its printed key into apps/web/.env.
const DEMO_API_KEY = process.env.NEXT_PUBLIC_SASH_DEMO_API_KEY;

/**
 * LiveDemo
 *
 * The landing page's live sandbox. The real @septic/sdk talking
 * to the real /api/v1/* routes, scoped to a dedicated "Sash Demo" Project so
 * visitor signups never touch a real customer's data. baseUrl is passed as
 * an empty string (not the SDK's localhost:3000 default) so requests
 * resolve as same-origin relative paths against whatever host serves this
 * page, in both dev and production.
 */
export default function LiveDemo() {
  return (
    <section
      id="demo"
      className="bg-[color:var(--wise-canvas-soft)] px-6 py-24 text-[color:var(--wise-ink)] sm:px-10"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="inline-flex items-center rounded-[var(--wise-radius-pill)] bg-[color:var(--wise-primary)] px-4 py-1 text-sm font-semibold text-[color:var(--wise-on-primary)]">
            Live sandbox
          </span>

          <h2 className="mt-6 [font-family:var(--font-wise-display)] text-4xl font-[900] leading-[1.05] sm:text-5xl">
            Try it for real.
          </h2>

          <p className="mt-4 max-w-md text-lg text-[color:var(--wise-body)]">
            This is the actual SDK talking to the actual API. Sign up,
            verify with a real one time code, sign back in. Nothing here is
            mocked.
          </p>

          <p className="mt-3 max-w-md text-sm text-[color:var(--wise-mute)]">
            Your signup creates a real row in the same Postgres database and
            Redis session store every Sash project runs on. It&apos;s just
            sandboxed to a demo project, isolated from every real customer by
            the same{" "}
            <code className="rounded-[var(--wise-radius-sm)] bg-[color:var(--wise-canvas)] px-1.5 py-0.5 text-xs">
              @@unique([email, projectId])
            </code>{" "}
            constraint that protects them.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="rounded-[var(--wise-radius-xl)] border border-[color:var(--wise-ink)] bg-[color:var(--wise-canvas)] p-6 sm:p-8"
        >
          {DEMO_API_KEY ? (
            <SashProvider apiKey={DEMO_API_KEY} baseUrl="">
              <DemoWidget />
            </SashProvider>
          ) : (
            <DemoPlaceholder />
          )}
        </motion.div>
      </div>
    </section>
  );
}

function DemoPlaceholder() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-semibold text-[color:var(--wise-ink)]">
        Live demo not configured yet
      </p>
      <p className="max-w-xs text-sm text-[color:var(--wise-mute)]">
        Set{" "}
        <code className="rounded-[var(--wise-radius-sm)] bg-[color:var(--wise-canvas-soft)] px-1.5 py-0.5">
          NEXT_PUBLIC_SASH_DEMO_API_KEY
        </code>{" "}
        in <code className="rounded-[var(--wise-radius-sm)] bg-[color:var(--wise-canvas-soft)] px-1.5 py-0.5">apps/web/.env</code>{" "}
        (run{" "}
        <code className="rounded-[var(--wise-radius-sm)] bg-[color:var(--wise-canvas-soft)] px-1.5 py-0.5">
          npx tsx apps/web/prisma/seed-demo.ts
        </code>{" "}
        to generate one) to turn this section on.
      </p>
    </div>
  );
}

function DemoWidget() {
  const { user, loading } = useSash();

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <p className="text-sm text-[color:var(--wise-mute)]">
          Restoring session…
        </p>
      </div>
    );
  }

  return user ? <AuthenticatedView /> : <UnauthenticatedView />;
}

// ─── Authenticated flow ─────────────────────────────────────────────────────
// Mirrors apps/demo-client/src/App.tsx's AuthenticatedView: once signup()
// resolves, useSash()'s user is set immediately (before verification), so
// this renders in place of <SignUp>'s own OTP step. Manual verify UI here
// covers that case, same as the reference client.

function AuthenticatedView() {
  const { user, logout, sendVerification, verifyEmail } = useSash();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSendVerification = async () => {
    try {
      await sendVerification(user!.email);
      setNotice("Verification code sent. Check the inbox for that address.");
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    setNotice("");
    try {
      await verifyEmail(user!.email, code);
      setNotice("Email verified.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="sash-card" style={{ border: "none", boxShadow: "none", padding: 0, margin: 0 }}>
      <div className="sash-card-header">
        <h3 className="sash-card-title">You&apos;re signed in</h3>
        <p className="sash-card-subtitle">Real session, real cookie, real Redis TTL.</p>
      </div>

      <div className="user-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <code>{user!.email}</code>
        <span
          className="rounded-[var(--wise-radius-pill)] px-3 py-1 text-xs font-semibold"
          style={
            user!.emailVerified
              ? { backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-positive-deep)" }
              : { backgroundColor: "var(--wise-canvas-soft)", color: "var(--wise-mute)" }
          }
        >
          {user!.emailVerified ? "Verified" : "Unverified"}
        </span>
      </div>

      {!user!.emailVerified && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="sash-button"
            onClick={handleSendVerification}
            style={{ marginBottom: 12 }}
          >
            Send verification code
          </button>

          <form onSubmit={handleVerify}>
            <div className="sash-form-group">
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                className="sash-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <button type="submit" className="sash-button" disabled={verifying || code.length < 6}>
              {verifying ? "Verifying…" : "Verify code"}
            </button>
          </form>
        </div>
      )}

      {error && <div className="sash-error">{error}</div>}
      {notice && (
        <p className="text-sm" style={{ color: "var(--wise-positive-deep)" }}>
          {notice}
        </p>
      )}

      <button
        type="button"
        className="sash-link"
        onClick={logout}
        style={{ marginTop: 16, background: "none", border: "none", cursor: "pointer" }}
      >
        Sign out
      </button>
    </div>
  );
}

// ─── Unauthenticated flow ───────────────────────────────────────────────────
// Same login/signup/forgot mode-switching pattern as
// apps/demo-client/src/App.tsx's UnauthenticatedView.

function UnauthenticatedView() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");

  return (
    <div className="flex flex-col gap-6">
      {mode === "login" && (
        <>
          <SignIn
            subtitle="Sign in to the Sash demo project"
            onForgotPassword={() => setMode("forgot")}
          />
          <p className="text-center text-sm text-[color:var(--wise-mute)]">
            New here?{" "}
            <button
              type="button"
              className="sash-link"
              onClick={() => setMode("signup")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Create an account
            </button>
          </p>
        </>
      )}

      {mode === "signup" && (
        <>
          <SignUp subtitle="Create a throwaway account against the live demo project" />
          <p className="text-center text-sm text-[color:var(--wise-mute)]">
            Already signed up?{" "}
            <button
              type="button"
              className="sash-link"
              onClick={() => setMode("login")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Sign in
            </button>
          </p>
        </>
      )}

      {mode === "forgot" && (
        <ForgotPassword
          subtitle="We'll send a real code to reset it"
          onBackToSignIn={() => setMode("login")}
          onSuccess={() => setMode("login")}
        />
      )}
    </div>
  );
}
