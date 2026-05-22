# Sash — Claude Code Context File

This file is the single source of truth for understanding the Sash codebase.
Read this entire document before writing any code.

---

## What This Project Is

**Sash** is a multi-tenant "Auth-as-a-Service" (AaaS) platform — think a lightweight Clerk or Auth0 clone.

**The product has two distinct user types:**
1. **Project Owners (Developers):** People who sign up to the Sash Dashboard at `apps/web` to create "projects" and get an API key.
2. **End-Users:** People who sign up to *a developer's app* (e.g., the `demo-client`) using the Sash API via an SDK.

These two user types are stored in completely separate database models and authenticated via completely separate systems. Do not confuse them.

---

## Monorepo Structure

```
clerk-like/                         ← npm workspace root
├── apps/
│   ├── web/                        ← The Sash Platform (Next.js 16, App Router)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── auth/           ← NextAuth route handlers (for dashboard login)
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
│   │   │   │   ├── docs/           ← In-app documentation pages
│   │   │   │   ├── projects/       ← Project management UI
│   │   │   │   └── projects/[id]/users/ ← User directory per project
│   │   │   ├── login/              ← Dashboard login page
│   │   │   ├── register/           ← Dashboard register page
│   │   │   ├── forgot-password/    ← Dashboard forgot-password page
│   │   │   └── reset-password/     ← Dashboard reset-password page
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

### Three models, three purposes:

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

Every file in `apps/web/lib/` is a pure utility module. **Do not put business logic in API routes** — put it here and import it.

| File | Purpose |
|---|---|
| `api-key.ts` | `validateApiKey(req)` → finds the Project from the Bearer token or throws `ApiKeyError`. This is the **first thing called** in every `/api/v1/*` route. |
| `auth.ts` | NextAuth v5 config for dashboard login. Credentials provider, looks up `ProjectOwner`, verifies bcrypt hash. |
| `auth.config.ts` | NextAuth base config (session strategy, pages, callbacks). |
| `email.ts` | Resend email dispatch. `sendVerificationEmail()` and `sendPasswordResetEmail()`. |
| `middleware-helpers.ts` | `jsonError()`, `jsonSuccess()`, `getIp()`, `getSessionIdFromRequest()`, `SESSION_COOKIE_NAME`, `SESSION_COOKIE_OPTIONS`. Use these everywhere for consistent response shapes. |
| `otp.ts` | `generateOtp()`, `storeOtp()`, `verifyOtp()`. Redis-backed, 10-min TTL, 5-attempt brute-force protection. Returns `"ok" \| "invalid" \| "expired" \| "locked"`. |
| `prisma.ts` | Singleton Prisma client. Always import from here: `import { prisma } from "@/lib/prisma"`. |
| `rate-limit.ts` | `rateLimit(key, maxAttempts, windowSecs)`. Atomic Redis INCR. `buildRateLimitKey(projectId, ip)` for namespaced keys. |
| `redis.ts` | Upstash Redis singleton. Always import from here: `import { redis } from "@/lib/redis"`. |
| `session.ts` | `createSession()`, `getSession()`, `deleteSession()`, `refreshSession()`, `invalidateAllUserSessions()`. Redis-backed, 7-day sliding window TTL. Key format: `session:<sessionId>`. |
| `validations.ts` | All Zod schemas (`signupSchema`, `loginSchema`, etc.) and `safeParse()` helper. |
| `webhook.ts` | `dispatchWebhook(project, event, user)`. Fire-and-forget (no `await`). HMAC-SHA256 signed via `X-Sash-Signature` header. |

---

## How `/api/v1/*` Routes Work — The Standard Pattern

Every route in `/api/v1/` follows this exact order:

```
1. validateApiKey(req)         → identifies the Project (tenant)
2. rateLimit(...)              → blocks brute-force (on sensitive routes)
3. req.json() + safeParse()    → parses and validates the body with Zod
4. Business logic              → database reads/writes via prisma
5. jsonSuccess() / jsonError() → consistent response shape
6. dispatchWebhook()           → fire-and-forget, no await (on state-changing routes)
```

**Never skip step 1.** Without it, you have no `projectId` and multi-tenancy breaks.
**Never skip step 3.** All inputs must go through Zod. Raw `req.json()` alone is not enough.

---

## The Two Authentication Systems — Do NOT Mix Them Up

### System 1: Dashboard Auth (NextAuth v5)
- **Who:** `ProjectOwner` — developers using the Sash dashboard.
- **How:** Standard NextAuth Credentials provider. Sets a NextAuth JWT session cookie.
- **Server access:** `import { auth } from "@/lib/auth"` then `await auth()` in Server Components.
- **Protected routes:** Dashboard pages check for NextAuth session in layout or middleware.
- **Endpoints:** `/api/auth/[...nextauth]`

### System 2: End-User Auth (Custom Redis Sessions)
- **Who:** `User` — end-users of developers' apps.
- **How:** Custom `HttpOnly` cookie (`sash_session`) containing a random hex session ID mapped to `{userId, projectId}` in Redis.
- **Server access:** `getSessionIdFromRequest(req)` → `getSession(sessionId)` → look up `User` in Prisma.
- **Endpoints:** `/api/v1/*`
- **Cookie name:** `sash_session` (from `SESSION_COOKIE_NAME` constant)

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

**Admin password resets** (for `ProjectOwner` dashboard accounts) use the virtual `projectId = "sash-admin"` to reuse the OTP infrastructure without polluting end-user namespaces.

---

## CORS & Security Headers

**File:** `apps/web/next.config.ts`

- CORS is configured for `/api/:path*` only. The allowed origin is `process.env.ALLOWED_ORIGIN` (defaults to `http://localhost:5173` for the demo client).
- Security headers applied to ALL routes: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`.
- If you add a new API route consumed by the SDK from a different origin, no code change is needed — it's handled globally.

---

## The React SDK (`packages/sdk`)

**Published as:** `@septic/sdk` on npm.
**Built with:** `tsup` — outputs CJS + ESM + `.d.ts` files. CSS is injected via `--injectStyle`.

### Why Vanilla CSS (not Tailwind)
Publishing Tailwind inside an npm package causes class-name collisions and forces consumers to configure their Tailwind `content` array to scan `node_modules`. Instead, the SDK uses scoped class names (`.sash-card`, `.sash-input`, etc.) with CSS variables (`--sash-brand`, `--sash-text-secondary`). `tsup --injectStyle` bundles and auto-injects the CSS when the component mounts.

### SDK Component Props

**`<SignIn />`**
```ts
subtitle?: string
redirectUrl?: string        // window.location.href after successful login
onForgotPassword?: () => void  // callback to switch to ForgotPassword view
```

**`<SignUp />`** — Multi-step: (email+password) → (OTP verification)
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

### `useSash()` hook returns:
```ts
{
  user: SashUser | null   // null = logged out or loading
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

### Session Restore on Page Refresh
`<SashProvider>` runs a `useEffect` on mount that calls `GET /api/v1/me`. The browser automatically attaches the `sash_session` cookie. If valid, the user is silently restored. If not, `loading` goes to `false` and `user` stays `null`.

---

## Environment Variables

All vars live in `apps/web/.env`. Required:

```env
# PostgreSQL (Neon)
DATABASE_URL=postgresql://...

# Redis (Upstash REST)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re_...

# NextAuth (dashboard auth)
AUTH_SECRET=...                      # random secret, min 32 chars
NEXTAUTH_URL=http://localhost:3000

# Webhooks
WEBHOOK_SIGNING_SECRET=...           # used for HMAC-SHA256 signing

# CORS (what origin can call /api/*)
ALLOWED_ORIGIN=http://localhost:5173
```

---

## Common Gotchas

1. **Upstash auto-parses numeric strings.** If a stored OTP is `"123456"`, Redis returns it as the number `123456`. Always `String(stored)` before comparing OTPs. This is handled in `lib/otp.ts` — don't break it.

2. **`invalidateAllUserSessions` uses `SCAN`**, not `KEYS`. Never use `redis.keys("session:*")` — Upstash (and production Redis) blocks it. The SCAN cursor is returned as a string by Upstash — always `Number(nextCursor)`.

3. **Two Bearer token types exist.** API keys start with `sash_live_`. Session IDs are raw hex. `getSessionIdFromRequest()` distinguishes them by checking for the prefix.

4. **`dispatchWebhook` is never awaited.** It's fire-and-forget by design. A failing webhook must not block the auth response.

5. **Password max length is 72 chars.** This is bcrypt's hard limit — hashing bytes 73+ are silently ignored. The Zod schema enforces this.

6. **`prisma generate` runs automatically on `npm install`** via the `postinstall` script in `apps/web/package.json`. If Prisma client is missing, run `npm install` from the repo root.

7. **The monorepo uses npm workspaces.** Run commands from the root with `--workspace=apps/web` or `cd` into the workspace. Never run `npm install` inside `apps/web` directly.

---

## Running the Project Locally

```bash
# From repo root
npm install                                    # installs all workspaces + runs prisma generate
npm run db:push --workspace=apps/web           # sync schema to Neon (first time or after schema changes)
npm run dev --workspace=apps/web               # start Next.js on :3000
npm run dev --workspace=demo-client            # start Vite client on :5173
```

---

## Code Style Rules

- Always use `import { prisma } from "@/lib/prisma"` — never instantiate a new PrismaClient.
- Always use `import { redis } from "@/lib/redis"` — never instantiate a new Redis client.
- Always use `jsonError()` and `jsonSuccess()` from `lib/middleware-helpers.ts` — never raw `new Response()`.
- Always validate API inputs with `safeParse(schema, rawBody)` — never access `body.field` without Zod.
- Error messages from API routes must be generic enough to not reveal internal structure. Check existing routes for tone.
- All catch blocks must use `catch (err: unknown)` — never `catch (err: any)`.
