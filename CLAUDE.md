# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Project Is

**Sash** is a multi-tenant "Auth-as-a-Service" (AaaS) platform — think a lightweight Clerk or Auth0 clone.

**Two distinct user types:**
1. **Project Owners (Developers):** People who sign up to the Sash Dashboard (`apps/web`) to create "projects" and get an API key.
2. **End-Users:** People who sign up to *a developer's app* (e.g., `demo-client`) using the Sash API via the SDK.

These two user types live in completely separate database models and are authenticated via completely separate systems. Do not confuse them.

---

## Commands

### Running Locally

```bash
# From repo root
npm install                                    # installs all workspaces + runs prisma generate
npm run db:push --workspace=apps/web           # sync schema to Neon (first time or after schema changes)
npm run dev --workspace=apps/web               # start Next.js on :3000
npm run dev --workspace=demo-client            # start Vite demo client on :5173
```

### Web App (`apps/web`)

```bash
npm run build --workspace=apps/web
npm run lint --workspace=apps/web
npm run db:generate --workspace=apps/web       # prisma generate
npm run db:migrate --workspace=apps/web        # prisma migrate dev
npm run db:studio --workspace=apps/web         # open Prisma Studio
```

### SDK (`packages/sdk`)

```bash
npm run build --workspace=packages/sdk         # tsup — outputs CJS + ESM + .d.ts
npm run dev --workspace=packages/sdk           # tsup watch mode
npm run typecheck --workspace=packages/sdk     # tsc --noEmit
```

---

## Monorepo Structure

```
clerk-like/                         ← npm workspace root
├── apps/
│   ├── web/                        ← The Sash Platform (Next.js 16, App Router)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── auth/           ← NextAuth route handlers (dashboard login)
│   │   │   │   ├── dashboard/      ← Dashboard API (projects CRUD, user management)
│   │   │   │   └── v1/             ← PUBLIC API (consumed by @septic/sdk)
│   │   │   │       ├── signup/
│   │   │   │       ├── login/
│   │   │   │       ├── logout/
│   │   │   │       ├── me/
│   │   │   │       ├── send-verification/
│   │   │   │       ├── verify-email/
│   │   │   │       ├── forgot-password/
│   │   │   │       └── reset-password/
│   │   │   ├── dashboard/          ← Developer Dashboard UI pages (protected)
│   │   │   │   ├── docs/
│   │   │   │   ├── projects/
│   │   │   │   └── projects/[id]/users/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── lib/                    ← ALL shared server-side helpers (see below)
│   │   ├── prisma/
│   │   │   └── schema.prisma       ← Database schema (PostgreSQL via Neon)
│   │   └── next.config.ts          ← CORS + security headers config
│   └── demo-client/                ← Vite + React app demonstrating the SDK
│       └── src/
│           ├── App.tsx             ← Uses <SignIn>, <SignUp>, <ForgotPassword>
│           └── main.tsx            ← Wraps app with <SashProvider>
└── packages/
    └── sdk/                        ← @septic/sdk — the published npm package
        └── src/
            ├── client.ts           ← Typed fetch wrapper (SashClient class)
            ├── context.tsx         ← <SashProvider> and useSash() hook
            ├── types.ts            ← Shared TypeScript interfaces
            ├── index.css           ← Vanilla CSS for UI components
            ├── index.ts            ← Public barrel export
            └── components/
                ├── SignIn.tsx
                ├── SignUp.tsx      ← Multi-step: signup → OTP verification
                └── ForgotPassword.tsx ← Multi-step: email → OTP → new password
```

---

## Database Schema (Prisma)

**File:** `apps/web/prisma/schema.prisma`

```
ProjectOwner   ← Sash Dashboard users (developers). Authenticated via NextAuth.
    │
    └── Project  ← A developer's registered app. Has a unique apiKey.
            │
            └── User  ← End-users of the developer's app. Project-scoped.
```

**Critical constraint on `User`:**
```prisma
@@unique([email, projectId])
```
This is the multi-tenancy keystone. The same email can exist in Project A and Project B as completely separate records. Every user query MUST include `projectId`.

**Key fields:**
- `Project.apiKey` — format: `sash_live_<64 hex chars>`. Unique. This is how API routes identify the tenant.
- `User.emailVerified` — boolean, default false. Does NOT block login. Exposed on `/me` so devs can gate their own features.
- `User.isActive` — soft-delete/suspend flag. When false, login returns 403 immediately.

---

## `lib/` — The Server-Side Helper Layer

Put business logic here, not in API routes.

| File | Purpose |
|---|---|
| `api-key.ts` | `validateApiKey(req)` → finds the Project from the Bearer token or throws `ApiKeyError`. **First thing called** in every `/api/v1/*` route. |
| `auth.ts` | NextAuth v5 config for dashboard login. Credentials provider, looks up `ProjectOwner`, verifies bcrypt hash. |
| `auth.config.ts` | NextAuth base config (session strategy, pages, callbacks). |
| `email.ts` | Resend email dispatch. `sendVerificationEmail()` and `sendPasswordResetEmail()`. |
| `middleware-helpers.ts` | `jsonError()`, `jsonSuccess()`, `getIp()`, `getSessionIdFromRequest()`, `SESSION_COOKIE_NAME`, `SESSION_COOKIE_OPTIONS`. |
| `otp.ts` | `generateOtp()`, `storeOtp()`, `verifyOtp()`. Redis-backed, 10-min TTL, 5-attempt brute-force protection. Returns `"ok" \| "invalid" \| "expired" \| "locked"`. |
| `prisma.ts` | Singleton Prisma client. Always import from here. |
| `rate-limit.ts` | `rateLimit(key, maxAttempts, windowSecs)`. Atomic Redis INCR. `buildRateLimitKey(projectId, ip)` for namespaced keys. |
| `redis.ts` | Upstash Redis singleton. Always import from here. |
| `session.ts` | `createSession()`, `getSession()`, `deleteSession()`, `refreshSession()`, `invalidateAllUserSessions()`. Redis-backed, 7-day sliding window TTL. |
| `validations.ts` | All Zod schemas (`signupSchema`, `loginSchema`, etc.) and `safeParse()` helper. Blocks 3500+ disposable email domains. |
| `webhook.ts` | `dispatchWebhook(project, event, user)`. Fire-and-forget (no `await`). HMAC-SHA256 signed via `X-Sash-Signature` header. |

---

## Standard `/api/v1/*` Route Pattern

Every route follows this exact order:

```
1. validateApiKey(req)         → identifies the Project (tenant)
2. rateLimit(...)              → blocks brute-force (on sensitive routes)
3. req.json() + safeParse()    → parses and validates the body with Zod
4. Business logic              → database reads/writes via prisma
5. jsonSuccess() / jsonError() → consistent response shape
6. dispatchWebhook()           → fire-and-forget, no await (on state-changing routes)
```

Never skip step 1 — without it there is no `projectId` and multi-tenancy breaks. Never skip step 3 — all inputs must go through Zod.

---

## The Two Authentication Systems

### System 1: Dashboard Auth (NextAuth v5)
- **Who:** `ProjectOwner` — developers using the Sash dashboard.
- **How:** NextAuth Credentials provider. Sets a NextAuth JWT session cookie.
- **Server access:** `import { auth } from "@/lib/auth"` → `await auth()` in Server Components.
- **Endpoints:** `/api/auth/[...nextauth]`

### System 2: End-User Auth (Custom Redis Sessions)
- **Who:** `User` — end-users of developers' apps.
- **How:** `HttpOnly` cookie (`sash_session`) containing a random hex session ID mapped to `{userId, projectId}` in Redis.
- **Server access:** `getSessionIdFromRequest(req)` → `getSession(sessionId)` → look up `User` in Prisma.
- **Endpoints:** `/api/v1/*`

---

## Redis Key Namespacing

| Pattern | Used for |
|---|---|
| `session:<sessionId>` | End-user sessions. TTL 7 days. |
| `otp:verify:<projectId>:<email>` | Email verification OTPs. TTL 10 min. |
| `otp:reset:<projectId>:<email>` | Password reset OTPs. TTL 10 min. |
| `otp_attempts:verify:<projectId>:<email>` | Attempt counter for verify OTPs. |
| `otp_attempts:reset:<projectId>:<email>` | Attempt counter for reset OTPs. |
| `rate_limit:<projectId>:<ip>` | Rate limit counter. TTL = window size. |

Admin password resets (for `ProjectOwner` accounts) use the virtual `projectId = "sash-admin"` to reuse OTP infrastructure without polluting end-user namespaces.

---

## The React SDK (`packages/sdk`)

**Published as:** `@septic/sdk`. Built with `tsup` — CJS + ESM + `.d.ts`. CSS auto-injected via `--injectStyle`.

**Why Vanilla CSS (not Tailwind):** Publishing Tailwind in an npm package causes class-name collisions and forces consumers to configure `content` to scan `node_modules`. Instead: scoped class names (`.sash-card`, `.sash-input`) with CSS variables (`--sash-brand`, `--sash-text-secondary`).

### Component Props

**`<SignIn />`**
```ts
subtitle?: string
redirectUrl?: string           // window.location.href after successful login
onForgotPassword?: () => void  // callback to switch to ForgotPassword view
```

**`<SignUp />`** — Multi-step: (email + password) → (OTP verification)
```ts
subtitle?: string
redirectUrl?: string
onSuccess?: () => void
```

**`<ForgotPassword />`** — Multi-step: (email) → (OTP + new password)
```ts
subtitle?: string
onSuccess?: () => void
onBackToSignIn?: () => void
```

### `useSash()` hook

```ts
{
  user: SashUser | null   // null = logged out or still loading
  loading: boolean        // true on first mount while restoring session
  login(email, password): Promise<SashUser>
  signup(email, password): Promise<SashUser>
  logout(): Promise<void>
  sendVerification(email): Promise<void>
  verifyEmail(email, code): Promise<void>
  forgotPassword(email): Promise<void>
  resetPassword(email, code, newPassword): Promise<void>
}
```

On mount, `<SashProvider>` calls `GET /api/v1/me` to silently restore the session from the `sash_session` cookie.

---

## Environment Variables

All vars live in `apps/web/.env`:

```env
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
RESEND_API_KEY=re_...
AUTH_SECRET=...                      # random secret, min 32 chars
NEXTAUTH_URL=http://localhost:3000
WEBHOOK_SIGNING_SECRET=...
ALLOWED_ORIGIN=http://localhost:5173 # what origin can call /api/*
```

---

## Gotchas

1. **Upstash auto-parses numeric strings.** A stored OTP `"123456"` is returned as number `123456`. Always `String(stored)` before comparing. This is handled in `lib/otp.ts` — don't break it.

2. **`invalidateAllUserSessions` uses `SCAN`, not `KEYS`.** Never use `redis.keys("session:*")` — Upstash blocks it in production. The SCAN cursor is returned as a string by Upstash — always `Number(nextCursor)`.

3. **Two Bearer token types exist.** API keys start with `sash_live_`. Session IDs are raw hex. `getSessionIdFromRequest()` distinguishes them by prefix.

4. **`dispatchWebhook` is never awaited.** Fire-and-forget by design — a failing webhook must not block the auth response.

5. **Password max is 72 chars.** bcrypt's hard limit — bytes 73+ are silently ignored. The Zod schema enforces this.

6. **`prisma generate` runs automatically on `npm install`** via `postinstall` in `apps/web/package.json`. If Prisma client is missing, run `npm install` from the repo root.

7. **Never run `npm install` inside a workspace directly.** Use `--workspace=<name>` from the root or `cd` into the workspace after the root install.

---

## Code Style

- `import { prisma } from "@/lib/prisma"` — never instantiate a new `PrismaClient`.
- `import { redis } from "@/lib/redis"` — never instantiate a new Redis client.
- `jsonError()` / `jsonSuccess()` from `lib/middleware-helpers.ts` — never raw `new Response()`.
- `safeParse(schema, rawBody)` — never access `body.field` without Zod validation.
- `catch (err: unknown)` — never `catch (err: any)`.
- API error messages must be generic — don't expose internal structure.
