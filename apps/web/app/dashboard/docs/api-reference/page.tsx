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
    description: "Send a 6-digit OTP to the user's email for email verification. Code is valid for 10 minutes.",
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
  GET: "text-emerald-400 bg-emerald-400/10",
  POST: "text-[color:var(--color-brand-light)] bg-[color:var(--color-brand-dim)]",
  DELETE: "text-red-400 bg-red-400/10",
};

export default function ApiReferencePage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[color:var(--color-border-subtle)]">
        <p className="text-[12px] font-semibold text-[color:var(--color-brand-light)] uppercase tracking-wider mb-2">API Reference</p>
        <h1 className="text-[24px] font-bold tracking-tight text-[color:var(--color-text-primary)] mb-2">All Endpoints</h1>
        <p className="text-[14px] text-[color:var(--color-text-secondary)]">
          All requests require the <code className="font-mono text-[13px] text-amber-400">Authorization: Bearer &lt;api_key&gt;</code> header unless noted.
          Session-authenticated endpoints (like <code className="font-mono text-[13px]">/me</code>) also require the session cookie.
        </p>
      </div>

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
      <div className="space-y-6 mt-2">
        {endpoints.map((ep) => (
          <div
            key={ep.path}
            className="rounded-[16px] bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] overflow-hidden shadow-sm"
          >
            {/* Endpoint header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[color:var(--color-border-subtle)]">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg font-mono ${methodColor[ep.method] ?? "text-white bg-white/10"}`}>
                {ep.method}
              </span>
              <code className="text-[14px] font-mono text-[color:var(--color-text-primary)]">{ep.path}</code>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[color:var(--color-text-secondary)]">{ep.description}</p>

              {ep.body && (
                <div>
                  <p className="text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-1.5">Request Body</p>
                  <CodeBlock language="json" code={ep.body} />
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-1.5">Success Response</p>
                <CodeBlock language="json" code={ep.success} />
              </div>

              {ep.errors.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-2">Error Codes</p>
                  <div className="space-y-1.5">
                    {ep.errors.map((err) => (
                      <div key={err.code} className="flex items-start gap-3 text-[13px]">
                        <code className="font-mono text-red-400 w-8 shrink-0">{err.code}</code>
                        <span className="text-[color:var(--color-text-secondary)]">{err.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
