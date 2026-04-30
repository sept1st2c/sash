<div align="center">
  <h1>Sash</h1>
  <p><strong>Auth-as-a-Service for modern applications.</strong></p>
  <p>Drop authentication into any React app with a single Provider and one API key.</p>

  <p>
    <a href="https://sash-auth.vercel.app">Live Dashboard</a>
    ·
    <a href="https://www.npmjs.com/package/@septic/sdk">npm Package</a>
    ·
    <a href="https://sash-auth.vercel.app/dashboard/docs">Documentation</a>
  </p>

  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Redis-Upstash-green?style=flat-square&logo=redis" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/npm/v/@septic/sdk?style=flat-square&label=%40septic%2Fsdk&color=blueviolet" />
</div>

---

## Overview

Sash is a hosted authentication platform. Instead of building login, session management, email verification, and password resets yourself — you integrate Sash and let it handle everything.

**You get:**
- A project dashboard to manage your apps and API keys
- A REST API for all auth operations
- A React SDK (`@septic/sdk`) for plug-and-play frontend integration
- Webhook events fired on every auth action
- Built-in email delivery via Resend

---

## Quick Start

### 1. Install the SDK

```bash
npm install @septic/sdk
```

### 2. Wrap your app

```tsx
import { SashProvider } from "@septic/sdk";

export default function RootLayout({ children }) {
  return (
    <SashProvider apiKey={process.env.NEXT_PUBLIC_SASH_API_KEY!}>
      {children}
    </SashProvider>
  );
}
```

### 3. Use the hook

```tsx
import { useSash } from "@septic/sdk";

export function AuthButtons() {
  const { user, login, logout, loading } = useSash();

  if (loading) return <p>Loading...</p>;
  if (user) return <button onClick={logout}>Sign out ({user.email})</button>;

  return <button onClick={() => login("you@example.com", "password")}>Sign in</button>;
}
```

---

## Features

| Feature | Details |
|---|---|
| **Signup & Login** | Email + password, bcrypt-hashed (cost 12) |
| **Sessions** | Redis-backed, HTTP-only cookies, 7-day TTL |
| **Email Verification** | 6-digit OTP via Resend, 10-minute expiry, 5-attempt limit |
| **Password Reset** | OTP-based, invalidates all sessions on success |
| **Rate Limiting** | Per-IP, per-project, Redis INCR — brute-force protection |
| **Multi-Tenancy** | Full project isolation via compound unique `[email, projectId]` |
| **Webhooks** | HMAC-SHA256 signed events for every auth action |
| **React SDK** | `SashProvider` + `useSash()` hook, TypeScript-first |

---

## API Reference

All endpoints require `Authorization: Bearer <api_key>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/signup` | Create a new user account |
| `POST` | `/api/v1/login` | Authenticate and create a session |
| `GET` | `/api/v1/me` | Return the current session user |
| `POST` | `/api/v1/logout` | Invalidate the current session |
| `POST` | `/api/v1/send-verification` | Send OTP to verify email |
| `POST` | `/api/v1/verify-email` | Verify email with OTP code |
| `POST` | `/api/v1/forgot-password` | Send password reset OTP |
| `POST` | `/api/v1/reset-password` | Reset password with OTP |

Full request/response schemas are available in the [live docs](https://sash-auth.vercel.app/dashboard/docs/api-reference).

---

## Webhook Events

Sash fires signed `POST` requests to your configured webhook URL on every auth event.

```json
{
  "event": "user.signup",
  "projectId": "project_abc123",
  "timestamp": "2026-04-30T01:00:00.000Z",
  "data": { "id": "user_xyz", "email": "user@example.com" }
}
```

**Verify the signature** using the `X-Sash-Signature` HMAC-SHA256 header against your `WEBHOOK_SIGNING_SECRET`.

Events: `user.signup` · `user.login` · `user.verified` · `user.password-reset`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL via [Neon](https://neon.tech) + Prisma ORM |
| Cache / Sessions | Redis via [Upstash](https://upstash.com) |
| Email | [Resend](https://resend.com) |
| Auth (Dashboard) | NextAuth v5 |
| Deployment | [Vercel](https://vercel.com) |
| SDK | Published to [npm](https://www.npmjs.com/package/@septic/sdk) |

---

## Monorepo Structure

```
clerk-like/
├── apps/
│   ├── web/              # Next.js backend + dashboard (deployed to Vercel)
│   └── demo-client/      # Vite React app for SDK testing
└── packages/
    └── sdk/              # @septic/sdk — published to npm
        ├── src/
        │   ├── client.ts     # SashClient — raw HTTP fetch layer
        │   ├── context.tsx   # SashProvider + useSash() hook
        │   ├── types.ts      # Shared TypeScript types
        │   └── index.ts      # Public barrel export
        └── dist/             # Built CJS + ESM + .d.ts
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `WEBHOOK_SIGNING_SECRET` | HMAC secret for signing webhook payloads |

---

## Local Development

```bash
# Install all workspace dependencies
npm install

# Set up your database schema
npm run db:push --workspace=apps/web

# Start the Next.js backend
npm run dev --workspace=apps/web

# (Optional) Start the demo client for SDK testing
npm run dev --workspace=apps/demo-client
```

---

## License

MIT
