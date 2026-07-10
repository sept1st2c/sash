"use client";
import { motion, type Variants } from "motion/react";
import { DocSection } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/signup",
    description: "Create a new user account in a project.",
    body: `{ "email": "user@example.com", "password": "mypassword" }`,
    success: `201 { "user": { "id", "email", "emailVerified", "isActive", "createdAt" }, "sessionId": "..." }`,
    errors: [
      { code: 401, desc: "Missing or invalid API key." },
      { code: 409, desc: "Email already registered in this project." },
      { code: 422, desc: "Invalid email or password too short (< 8 chars)." },
      { code: 429, desc: "Rate limit exceeded (10 requests / 60s per IP)." },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/login",
    description: "Authenticate an existing user and create a session.",
    body: `{ "email": "user@example.com", "password": "mypassword" }`,
    success: `200 { "user": { "id", "email", "emailVerified", "isActive" }, "sessionId": "..." }`,
    errors: [
      { code: 401, desc: "Invalid credentials." },
      { code: 403, desc: "Account is suspended (isActive: false)." },
      { code: 429, desc: "Rate limit exceeded." },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/me",
    description: "Return the currently authenticated user using their session cookie.",
    body: null,
    success: `200 { "user": { "id", "email", "emailVerified", "isActive", "createdAt" } }`,
    errors: [
      { code: 401, desc: "No session cookie, session expired, or invalid." },
      { code: 403, desc: "Account is suspended." },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/logout",
    description: "Invalidate the current session and clear the session cookie.",
    body: null,
    success: `200 { "message": "Logged out." }`,
    errors: [
      { code: 401, desc: "No active session found." },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/send-verification",
    description: "Send a 6-digit OTP to the user's email for email verification. The code is valid for 10 minutes.",
    body: `{ "email": "user@example.com" }`,
    success: `200 { "message": "Verification email sent." }`,
    errors: [
      { code: 401, desc: "Invalid API key." },
      { code: 404, desc: "User not found in this project." },
      { code: 429, desc: "Rate limit exceeded." },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/verify-email",
    description: "Verify a user's email using the 6-digit OTP. Marks emailVerified: true on success.",
    body: `{ "email": "user@example.com", "code": "123456" }`,
    success: `200 { "message": "Email verified successfully." }`,
    errors: [
      { code: 400, desc: "Incorrect or expired OTP. Max 5 attempts." },
      { code: 401, desc: "Invalid API key." },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/forgot-password",
    description: "Send a password-reset OTP. Always returns 200 to prevent user enumeration.",
    body: `{ "email": "user@example.com" }`,
    success: `200 { "message": "If an account exists, a reset email was sent." }`,
    errors: [
      { code: 401, desc: "Invalid API key." },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/reset-password",
    description: "Reset a user's password using the OTP. Invalidates all active sessions on success.",
    body: `{ "email": "user@example.com", "code": "123456", "newPassword": "newpass123" }`,
    success: `200 { "message": "Password reset successfully." }`,
    errors: [
      { code: 400, desc: "Incorrect or expired OTP." },
      { code: 401, desc: "Invalid API key." },
      { code: 422, desc: "New password too short (< 8 chars)." },
    ],
  },
];

const methodColor: Record<string, string> = {
  GET: "var(--wise-accent-cyan)",
  POST: "var(--wise-primary)",
  DELETE: "var(--wise-negative)",
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ApiReferencePage() {
  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 pb-6 border-b"
        style={{ borderColor: "var(--wise-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--wise-positive-deep)" }}>
          API Reference
        </p>
        <h1
          className="text-[26px] md:text-[30px] tracking-tight mb-2"
          style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
        >
          All Endpoints
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
          Every request needs an{" "}
          <code className="font-mono text-[13px]" style={{ color: "var(--wise-warning)" }}>Authorization: Bearer &lt;api_key&gt;</code> header
          unless noted. Session-authenticated endpoints (like{" "}
          <code className="font-mono text-[13px]">/me</code>) also need the session cookie.
        </p>
      </motion.div>

      <DocSection title="Authentication Header">
        <CodeBlock
          language="bash"
          code={`curl https://your-sash-url.com/api/v1/signup \\
  -H "Authorization: Bearer sash_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"password123"}'`}
        />
      </DocSection>

      {/* Endpoints */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        className="space-y-6 mt-2"
      >
        {endpoints.map((ep) => (
          <motion.div
            key={ep.path}
            variants={rise}
            className="rounded-[var(--wise-radius-lg)] overflow-hidden"
            style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
          >
            {/* Endpoint header */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: "var(--wise-border)" }}
            >
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-[var(--wise-radius-md)] font-mono"
                style={{
                  color: "var(--wise-on-primary)",
                  backgroundColor: methodColor[ep.method] ?? "var(--wise-mute)",
                }}
              >
                {ep.method}
              </span>
              <code className="text-[14px] font-mono" style={{ color: "var(--wise-ink)" }}>{ep.path}</code>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--wise-body)" }}>{ep.description}</p>

              {ep.body && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--wise-mute)" }}>Request Body</p>
                  <CodeBlock language="json" code={ep.body} />
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--wise-mute)" }}>Success Response</p>
                <CodeBlock language="json" code={ep.success} />
              </div>

              {ep.errors.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--wise-mute)" }}>Error Codes</p>
                  <div className="space-y-1.5">
                    {ep.errors.map((err) => (
                      <div key={err.code} className="flex items-start gap-3 text-[13px]">
                        <code className="font-mono w-8 shrink-0" style={{ color: "var(--wise-negative)" }}>{err.code}</code>
                        <span style={{ color: "var(--wise-body)" }}>{err.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
