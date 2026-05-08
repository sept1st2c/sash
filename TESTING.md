# Sash Platform Testing & Security Guide

This guide provides end-to-end instructions for testing the Sash authentication flow as an end-user, alongside a deep dive into how Sash manages API keys and security.

---

## Part 1: How to Test the Entire App

There are two primary ways to test Sash: using the provided **Demo Client** (which consumes the React SDK) or by hitting the **Raw API Endpoints** (e.g., via Postman or cURL).

### Prerequisites
Before testing, ensure you have:
1. Created an account on the **Sash Developer Dashboard** (`http://localhost:3000`).
2. Created a **Project** in the dashboard.
3. Copied the **API Key** (`sash_live_...`) from the project dashboard.

### Method A: Testing via the Demo Client (Recommended)

The demo client uses the `@septic/sdk` React package to render the drop-in UI components.

1. **Configure the Client:**
   Open `apps/demo-client/.env.local` (or create it) and add your API key:
   ```env
   VITE_SASH_API_KEY=sash_live_your_copied_api_key
   ```
2. **Run the Client:**
   ```bash
   npm run dev --workspace=demo-client
   ```
   *The client will start at `http://localhost:5173`.*

3. **Test the Flow:**
   - **Sign Up:** Use the `<SignUp />` drop-in component. Enter an email and password. You will seamlessly transition to the OTP step.
   - **Check Email:** Check your Resend logs (or your actual inbox if testing with real emails) to find the 6-digit OTP. Enter it to verify the account.
   - **Dashboard Status:** Go to the Sash Developer Dashboard (`localhost:3000`), open your Project, and click **"View Directory"**. You will see your newly registered test user!
   - **Suspend User:** In the developer dashboard, click the three dots next to the user and click **Suspend**. Try to click "Sign out" then "Sign in" on the demo client—you will receive a `403` error!
   - **Forgot Password:** On the demo client sign-in page, click "Forgot password?" and go through the OTP reset flow.

### Method B: Testing via Postman / cURL

If you prefer to test the raw backend engine without the SDK UI, you can use Postman or terminal cURL commands. **Every request must include your API Key in the Authorization header.**

**1. Create a User (Sign Up)**
```bash
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Authorization: Bearer sash_live_your_copied_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SuperSecretPassword123"}'
```

**2. Send Verification OTP**
```bash
curl -X POST http://localhost:3000/api/v1/send-verification \
  -H "Authorization: Bearer sash_live_your_copied_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**3. Verify the OTP**
```bash
curl -X POST http://localhost:3000/api/v1/verify-email \
  -H "Authorization: Bearer sash_live_your_copied_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'
```

---

## Part 2: API Key Architecture & Security

How exactly do API keys work in Sash, and how are they kept safe?

### 1. The Structure of an API Key
Sash generates keys using cryptographically secure randomness:
```ts
`sash_live_${randomBytes(32).toString("hex")}`
```
- **The Prefix (`sash_live_`):** This is an industry standard (similar to Stripe's `sk_live_`). It allows automated secret scanners (like GitHub Advanced Security) to easily detect if a developer accidentally commits their Sash API key to a public repository.
- **The Entropy:** 32 random bytes (64 hex characters) provides 256 bits of entropy, making it mathematically impossible to brute-force or guess.

### 2. Multi-Tenant Gateway (The "Bouncer")
In Sash, the API key is not just a secret—it is the **Identity of the Project**.
Whenever a request hits `/api/v1/*`, the very first thing that runs is `validateApiKey()`.
1. It extracts the Bearer token.
2. It queries PostgreSQL for a `Project` matching that exact `apiKey`.
3. If valid, the resulting `projectId` is passed down into the request handlers.

### 3. Complete Data Isolation
Because every request is forced through the `validateApiKey()` gateway, the `projectId` is hardcoded into every database action.
When a user signs up, the SQL looks like:
```sql
INSERT INTO users (email, passwordHash, projectId) VALUES (...)
```
Because the `users` table has a strict `@@unique([email, projectId])` index, **User A** in Project A is completely isolated from **User A** in Project B. A leaked API key for Project A cannot be used to modify or read users in Project B.

### 4. How the Keys are Kept Safe
- **Stored in Plain Text (by design):** Unlike passwords (which are hashed using `bcrypt`), API keys in Sash are stored in plain text in the database. This is because the API key acts as an identifier, not a password. When a request comes in, we must quickly `SELECT * FROM Project WHERE apiKey = ?`. (Note: In a massive enterprise system, we would hash the keys and require the user to pass a `{ProjectID}:{KeySecret}` pair, but plain text is standard for MVP Auth-as-a-Service).
- **Transport Security:** Keys are **only** transmitted via `Authorization: Bearer` headers over HTTPS. They are never sent in URLs, query parameters, or request bodies, meaning they will not show up in proxy logs, server access logs, or browser histories.
- **Rate Limiting Protection:** The Redis rate-limiter groups attempts by the `projectId`. If an attacker tries to spam the API using a leaked key, the rate limiter (`10 requests / 60 seconds`) will instantly shut them down, protecting the database from DDoS attacks.
- **Client-Side Safety:** Because the React SDK interacts with the Next.js API, the developer exposes their API key to the browser (e.g., `NEXT_PUBLIC_SASH_API_KEY`). This is expected! The API key *only* grants permission to sign up or log into *that specific project*. It does not grant administrative access to the Developer Dashboard or the ability to view other users' data. Administrative actions (like suspending users) are strictly gated behind NextAuth.js sessions on the `apps/web` dashboard.
