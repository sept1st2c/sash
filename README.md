# Sash  —  Auth as a Service

> Drop-in, production-ready authentication for any React application. One API key, one Provider, zero auth headaches.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://sash-auth.vercel.app)
[![SDK on npm](https://img.shields.io/npm/v/@septic/sdk?label=%40septic%2Fsdk&color=cb3837&logo=npm)](https://www.npmjs.com/package/@septic/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🚀 What is Sash?

Sash is a robust, hosted "Auth-as-a-Service" platform built to rival Clerk and Auth0. Instead of building login flows, session management, security headers, and email verification from scratch for every side project or MVP, developers can create a project in the Sash dashboard, grab an API key, and integrate fully functional, beautiful authentication in minutes using our React SDK.

---

## ✨ Features

### 🛡️ Enterprise-Grade Security
- **Strict Validation Layer:** All API inputs are rigorously protected by `zod` schemas.
- **Disposable Email Blocking:** Automatically detects and blocks over 3,500+ known disposable/burner email domains.
- **Security Headers:** Enforces HSTS, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, and strictly configured CORS rules.
- **Rate Limiting:** Atomic Redis INCR counters per IP per project prevent brute-force attacks.
- **User Enumeration Protection:** Uniform timing and generic response messages prevent attackers from discovering which emails exist in the database.

### 🧩 Drop-In React UI Components
Stop wasting time writing forms. The `@septic/sdk` provides beautifully styled, customizable drop-in components built with **Vanilla CSS Variables** (no Tailwind forcing!).
- `<SignIn />` — Handles email/password auth and loading states.
- `<SignUp />` — Multi-step flow transitioning seamlessly from account creation to 6-digit OTP verification.
- `<ForgotPassword />` — End-to-end reset flow with secure token validation.

### ⚡ Core Auth & Sessions
- **Signup & Login:** Bcrypt-hashed passwords (cost=12), project-scoped user accounts.
- **Multi-Tenancy:** Complete user isolation between projects via compound unique keys.
- **Redis Sessions:** Fast, secure, HTTP-only session cookies with sliding-window configurable TTL.
- **Email Verification & Password Reset:** Ephemeral 6-digit OTPs backed by Redis TTLs (delivered via Resend).

### 🛠️ Developer Experience
- **Developer Dashboard:** A sleek NextAuth-secured dashboard to manage your projects, view analytics, and manage users.
- **User Directory:** View all end-users registered via your API key. Suspend or hard-delete malicious users with a single click.
- **Webhooks:** HMAC-signed POST events fired asynchronously on every auth action (e.g., `user.signup`).
- **In-App Docs:** Full integration guides right inside the dashboard.

---

## 🏗️ Tech Stack & Architecture

This project is structured as a **Turborepo** monorepo containing the main web platform, the React SDK, and a demo client.

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Database** | PostgreSQL via [Neon](https://neon.tech) + Prisma ORM |
| **Cache / Sessions** | Redis via [Upstash](https://upstash.com) |
| **Validation** | Zod |
| **Email** | [Resend](https://resend.com) |
| **Auth (Dashboard)** | NextAuth.js v5 |
| **SDK Build Tool** | tsup (`--injectStyle` enabled) |
| **Deployment** | Vercel |

### Monorepo Structure

```text
clerk-like/
├── apps/
│   ├── web/                  # The Sash platform / Developer Dashboard / Core API
│   │   ├── app/api/v1/       # End-user Auth API routes (scoped via API Key)
│   │   ├── app/dashboard/    # Developer UI (Projects, Webhooks, User Directory)
│   │   └── lib/              # Zod, Redis Sessions, Email, Webhook dispatch
│   └── demo-client/          # Vite React app testing the @septic/sdk components
└── packages/
    └── sdk/                  # @septic/sdk — the React SDK published to npm
        ├── src/components/   # SignIn, SignUp, ForgotPassword UI components
        ├── src/client.ts     # Internal fetch wrapper
        └── src/context.tsx   # SashProvider + useSash() hook
```

---

## 💻 SDK Quick Start

Integrating Sash into your React app takes less than 2 minutes.

### 1. Install

```bash
npm install @septic/sdk
```

### 2. Wrap your App

Initialize the `SashProvider` with the API key generated from your Sash Dashboard.

```tsx
// app/layout.tsx or main.tsx
import { SashProvider } from "@septic/sdk";

export default function RootLayout({ children }) {
  return (
    <SashProvider apiKey={process.env.NEXT_PUBLIC_SASH_API_KEY!}>
      {children}
    </SashProvider>
  );
}
```

### 3. Use the Pre-Built Components

```tsx
// components/AuthPage.tsx
import { SignIn, SignUp } from "@septic/sdk";

export function AuthPage() {
  return (
    <div className="flex gap-4">
      <SignIn subtitle="Sign in to your app" />
      <SignUp subtitle="Create a new account" />
    </div>
  );
}
```

### 4. Or Use the Headless Hook

If you want to build your own UI, you can use the `useSash()` hook to access the raw state and methods.

```tsx
// components/CustomButton.tsx
"use client";
import { useSash } from "@septic/sdk";

export function CustomButton() {
  const { user, loading, logout } = useSash();

  if (loading) return <p>Loading...</p>;
  if (user) return <button onClick={logout}>Sign out ({user.email})</button>;
  
  return <p>You are not logged in.</p>;
}
```

---

## 🔐 Webhook Verification

Sash can ping your backend whenever a user signs up. Every webhook request includes an `X-Sash-Signature` header — an HMAC-SHA256 hex digest of the raw body signed with your `WEBHOOK_SIGNING_SECRET`.

```ts
import crypto from "crypto";

function verifySashWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
```

---

## ⚙️ Running Locally

1. **Clone the repo**
   ```bash
   git clone https://github.com/sept1st2c/sash.git
   cd sash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create `apps/web/.env`:
   ```env
   DATABASE_URL=postgresql://...
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   RESEND_API_KEY=re_...
   AUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   WEBHOOK_SIGNING_SECRET=your_webhook_secret
   ```

4. **Initialize the Database**
   ```bash
   npm run db:push --workspace=apps/web
   ```

5. **Start the Development Servers**
   ```bash
   # Terminal 1: Run the Sash Platform
   npm run dev --workspace=apps/web
   
   # Terminal 2: Run the SDK auto-builder
   npm run dev --workspace=@septic/sdk

   # Terminal 3: Run the Demo Client
   npm run dev --workspace=demo-client
   ```

---

## 📄 License

MIT © [sept1st2c](https://github.com/sept1st2c)
