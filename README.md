# Sash — Auth as a Service

> Drop-in authentication for any React application. One API key, one Provider, zero auth headaches.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://sash-auth.vercel.app)
[![SDK on npm](https://img.shields.io/npm/v/@septic/sdk?label=%40septic%2Fsdk&color=cb3837&logo=npm)](https://www.npmjs.com/package/@septic/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What is Sash?

Sash is a hosted authentication platform. Instead of building login, sessions, and email verification from scratch in every project, you create a project in the Sash dashboard, grab an API key, and integrate in minutes.

```tsx
import { SashProvider, useSash } from "@septic/sdk";

// 1. Wrap your app
<SashProvider apiKey={process.env.NEXT_PUBLIC_SASH_API_KEY}>
  <App />
</SashProvider>

// 2. Use anywhere
const { user, login, logout } = useSash();
```

---

## Features

- **Signup & Login** — bcrypt-hashed passwords, project-scoped user accounts
- **Redis Sessions** — HTTP-only session cookies with configurable TTL
- **Email Verification** — 6-digit OTP via [Resend](https://resend.com), 10-minute expiry, brute-force protected
- **Password Reset** — OTP-based reset with automatic session invalidation
- **Rate Limiting** — Atomic Redis INCR counter per IP per project
- **Webhooks** — HMAC-signed POST events on every auth action
- **Multi-Tenancy** — Complete user isolation between projects via compound unique keys
- **React SDK** — `SashProvider` + `useSash()` hook, published to npm
- **Developer Dashboard** — Manage projects, API keys, and webhooks in one place
- **In-App Docs** — Full integration guides at `/dashboard/docs`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL via [Neon](https://neon.tech) + Prisma ORM |
| Cache / Sessions | Redis via [Upstash](https://upstash.com) |
| Email | [Resend](https://resend.com) |
| Auth (Dashboard) | NextAuth.js v5 |
| SDK | TypeScript + tsup, published to npm |
| Deployment | Vercel |

---

## Monorepo Structure

```
clerk-like/
├── apps/
│   ├── web/                  # The Sash platform (Next.js)
│   │   ├── app/
│   │   │   ├── api/v1/       # Auth API routes
│   │   │   └── dashboard/    # Dashboard UI + Docs
│   │   ├── lib/              # Session, OTP, Webhook, Rate-limit helpers
│   │   └── prisma/           # Database schema & migrations
│   └── demo-client/          # Vite React app for SDK testing
└── packages/
    └── sdk/                  # @septic/sdk — the React SDK
        └── src/
            ├── client.ts     # SashClient (fetch wrapper)
            ├── context.tsx   # SashProvider + useSash() hook
            ├── types.ts      # Shared TypeScript types
            └── index.ts      # Public barrel export
```

---

## API Reference

All endpoints require `Authorization: Bearer <api_key>`.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/signup` | Create a new user account |
| `POST` | `/api/v1/login` | Authenticate and create session |
| `GET` | `/api/v1/me` | Get current user from session cookie |
| `POST` | `/api/v1/logout` | Invalidate session |
| `POST` | `/api/v1/send-verification` | Send email OTP |
| `POST` | `/api/v1/verify-email` | Verify email with OTP |
| `POST` | `/api/v1/forgot-password` | Send password-reset OTP |
| `POST` | `/api/v1/reset-password` | Reset password with OTP |

Full documentation is available at `/dashboard/docs` after logging in.

---

## SDK Quick Start

```bash
npm install @septic/sdk
```

```tsx
// app/layout.tsx
import { SashProvider } from "@septic/sdk";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SashProvider apiKey={process.env.NEXT_PUBLIC_SASH_API_KEY!}>
          {children}
        </SashProvider>
      </body>
    </html>
  );
}
```

```tsx
// components/AuthButton.tsx
"use client";
import { useSash } from "@septic/sdk";

export function AuthButton() {
  const { user, loading, login, logout } = useSash();

  if (loading) return <p>Loading...</p>;
  if (user) return <button onClick={logout}>Sign out ({user.email})</button>;
  return <button onClick={() => login("you@example.com", "password")}>Sign in</button>;
}
```

---

## Environment Variables

Create `apps/web/.env` with the following:

```env
# Database
DATABASE_URL=postgresql://...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_...

# NextAuth
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Webhooks
WEBHOOK_SIGNING_SECRET=...
```

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/sept1st2c/sash.git
cd sash

# Install dependencies (runs prisma generate automatically)
npm install

# Set up the database
npm run db:push --workspace=apps/web

# Start the development server
npm run dev --workspace=apps/web
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## Webhook Verification

Every webhook request from Sash includes an `X-Sash-Signature` header — an HMAC-SHA256 hex digest of the raw body signed with your `WEBHOOK_SIGNING_SECRET`.

```ts
import crypto from "crypto";

function verifySashWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
```

---

## License

MIT © [sept1st2c](https://github.com/sept1st2c)
