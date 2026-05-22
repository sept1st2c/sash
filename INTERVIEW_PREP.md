# Sash — Complete Interview Preparation Guide

> Read this like a story. Every section explains the *why*, the *how*, and gives a real scenario.
> New words are explained the first time they appear in **bold + parentheses**.

---

## Table of Contents

1. [What You Built — The Elevator Pitch](#1-what-you-built--the-elevator-pitch)
2. [Full User Journey — Scenario Walkthrough](#2-full-user-journey--scenario-walkthrough)
3. [Dashboard — How a Developer Manages Projects](#3-dashboard--how-a-developer-manages-projects)
4. [Redis TTL, Sessions, and Rate Limiting](#4-redis-ttl-sessions-and-rate-limiting)
5. [Wrong API Key Scenarios](#5-wrong-api-key-scenarios)
6. [Webhooks — Architecture, Reliability, and Examples](#6-webhooks--architecture-reliability-and-examples)
7. [Multi-Tenancy — What It Is and How You Built It](#7-multi-tenancy--what-it-is-and-how-you-built-it)
8. [Redis Sessions vs JWT — Deep Comparison](#8-redis-sessions-vs-jwt--deep-comparison)
9. [How 2FA / OTP Works in This System](#9-how-2fa--otp-works-in-this-system)
10. [How Passwords Are Kept Safe](#10-how-passwords-are-kept-safe)
11. [Complete System Design](#11-complete-system-design)
12. [What's Unique About What You Built](#12-whats-unique-about-what-you-built)
13. [How Can This Be Made Better](#13-how-can-this-be-made-better)
14. [Database Schema Deep Dive](#14-database-schema-deep-dive)
15. [Every Interview Question — With Answers](#15-every-interview-question--with-answers)
16. [How Interviewers Will Try to Trap You — And How to Escape](#16-how-interviewers-will-try-to-trap-you--and-how-to-escape)
17. [How to Boast This Project](#17-how-to-boast-this-project)

---

## 1. What You Built — The Elevator Pitch

**Sash** is an **Authentication-as-a-Service (AaaS)** platform. Think of it like the difference between building your own elevator and just pressing a button in a building that already has one.

### The Problem It Solves

Every web app needs users to sign up and log in. But building authentication correctly is hard:
- Passwords must be stored safely (not in plain text)
- You need email verification
- You need forgot-password flows
- You need sessions so users stay logged in
- You need to protect against hackers trying millions of passwords

Most small teams don't have time to build all this securely. So they use services like **Clerk** or **Auth0** — which is exactly what Sash is.

### The Real-World Analogy

Imagine you're opening a hotel. You could:
- Build your own door-lock system from scratch (risky, expensive)
- OR rent a key-card system from a company that already built it perfectly

Sash is that key-card company. Developers sign up, get an API key, drop the SDK into their app, and their users can sign up and log in — all handled by Sash.

### Two Types of People Use This System

| Person | What They Do |
|---|---|
| **Developer (Project Owner)** | Signs up to the Sash Dashboard, creates a "project", gets an API key |
| **End-User** | Signs up to the developer's app, which secretly talks to Sash behind the scenes |

These two groups are completely separate in the database and use completely different login systems. This is the most important architectural decision in the whole project.

---

## 2. Full User Journey — Scenario Walkthrough

Let's trace every step of both flows with a real story.

### Scenario: "Arjun builds a book review app using Sash"

---

### Step 1: Arjun (Developer) Signs Up to Sash Dashboard

Arjun goes to `sash.app` and registers. 

**What happens in the code:**
```
POST /api/auth/register
→ Arjun's email + password received
→ Password is hashed with bcrypt (explained in section 10)
→ A new ProjectOwner row is created in PostgreSQL
→ NextAuth creates a session cookie
→ Arjun is now logged in to the dashboard
```

**Why NextAuth here?** NextAuth is a battle-tested library for dashboard-level auth. It handles cookies, sessions, and security headers so we don't have to reinvent the wheel for our own dashboard.

---

### Step 2: Arjun Creates a Project Called "BookReview"

In the dashboard, Arjun clicks "New Project" and names it "BookReview".

**What happens in the code:**
```
POST /api/dashboard/projects
→ Server checks if Arjun is logged in (via NextAuth session)
→ Generates a new API key: sash_live_a1b2c3d4...f9e8 (64 random hex characters)
→ Creates a new Project row in PostgreSQL linked to Arjun's ProjectOwner account
→ Returns the project + API key to the dashboard UI
```

**Why 64 hex characters?** That's 2^256 possible values. Even if someone tried a billion API keys per second, it would take longer than the age of the universe to guess one. This is **cryptographically secure randomness**.

---

### Step 3: Arjun Installs the SDK in His React App

```bash
npm install @septic/sdk
```

```jsx
// In his app's root file:
import { SashProvider } from '@septic/sdk';

function App() {
  return (
    <SashProvider apiKey="sash_live_a1b2c3d4...">
      <BookReviewApp />
    </SashProvider>
  );
}
```

**What the SashProvider does:** It's a **React Context** (a way to share data across your entire app without passing it down through every component). It stores the current logged-in user and exposes functions like `login()`, `signup()`, `logout()`.

On page load, `SashProvider` immediately calls `GET /api/v1/me` — this checks if the user already has a session cookie from a previous visit and silently restores them. This is why you stay logged in after refreshing the page.

---

### Step 4: A User (let's call her Priya) Signs Up on BookReview App

Priya visits Arjun's book review site and clicks "Sign Up". The `<SignUp />` component from the SDK appears.

**What Priya sees:** Email field, password field, Sign Up button.

**What actually happens (the full chain):**

```
PRIYA TYPES email + password and clicks Sign Up
↓
SDK's SignUp component calls: sashClient.signup(email, password)
↓
SashClient sends HTTP POST to:
  https://sash.app/api/v1/signup
  Headers: { Authorization: "Bearer sash_live_a1b2c3d4..." }
  Body: { email: "priya@gmail.com", password: "mypassword123" }
↓
Sash server receives the request and runs the Standard Route Pattern:

  1. validateApiKey(req)
     → Reads "sash_live_a1b2c3d4..." from the Authorization header
     → Looks up this key in the Project table in PostgreSQL
     → Finds "BookReview" project (projectId = "proj_xyz")
     → Now we know which tenant this request belongs to

  2. rateLimit("rate_limit:proj_xyz:103.12.4.5", 10, 60)
     → Redis atomically increments a counter for this IP
     → If this IP has made more than 10 requests in 60 seconds → 429 Too Many Requests
     → Priya is on her first attempt → counter = 1, allowed = true

  3. safeParse(signupSchema, body)
     → Zod validates: Is the email real? Is it from a disposable domain?
     → Password: 8-72 chars, at least 1 letter, at least 1 number
     → All good → continues

  4. Check for duplicate email (project-scoped)
     → SQL: SELECT * FROM users WHERE email='priya@gmail.com' AND projectId='proj_xyz'
     → No existing user → safe to continue

  5. Hash the password
     → bcrypt.hash("mypassword123", cost=12)
     → Output: "$2a$12$someRandomSaltAndHashedValue..."
     → The original password is NEVER stored

  6. Create User in PostgreSQL
     → INSERT INTO users (email, passwordHash, projectId) VALUES (...)
     → User ID generated: "user_abc123"

  7. Create session in Redis
     → Generate random sessionId: "f8a3bc..." (64 hex chars)
     → Redis: SET session:f8a3bc... '{"userId":"user_abc123","projectId":"proj_xyz"}' EX 604800
     → 604800 seconds = 7 days

  8. Fire webhook (no-await, fire-and-forget)
     → POST https://arjun-backend.com/webhooks
     → Body: { event: "user.signup", user: { id, email }, projectId, timestamp }
     → Signed with HMAC-SHA256 so Arjun knows it's really from Sash

  9. Set the session cookie + return response
     → Response sets cookie: sash_session=f8a3bc... (HttpOnly, Secure, SameSite=Strict)
     → Returns: { user: { id, email, emailVerified: false }, sessionId: "f8a3bc..." }

↓
Back in the browser:
SashProvider stores the user in React state
Priya is now logged in to BookReview
```

---

### Step 5: Priya Logs In (Next Day)

Priya comes back and logs in:

```
POST /api/v1/login
→ validateApiKey → find BookReview project
→ rate limit check
→ Zod validation
→ Find user: SELECT * FROM users WHERE email='priya@gmail.com' AND projectId='proj_xyz'
→ bcrypt.compare("enteredPassword", storedHash) → true
→ Check isActive flag → true (not suspended)
→ Create new session in Redis
→ Set new sash_session cookie
→ Return user data
→ Fire user.login webhook
```

**Why create a NEW session on login?** Each login gets a fresh session ID. This is a security principle — it prevents **session fixation attacks** (where a hacker pre-sets a session ID before you log in).

---

### Step 6: OTP Email Verification

After signup, Priya's `emailVerified` is `false`. The SDK can show a banner asking her to verify.

```
Priya clicks "Send Verification Email"
↓
POST /api/v1/send-verification
→ validateApiKey
→ generateOtp() → "847291" (random 6 digits)
→ storeOtp("verify", "proj_xyz", "priya@gmail.com", "847291")
   → Redis: SET otp:verify:proj_xyz:priya@gmail.com "847291" EX 600
   → Also deletes any previous attempt counter
→ sendVerificationEmail("priya@gmail.com", "847291") via Resend
↓
Priya gets an email with code 847291
Priya types it in
↓
POST /api/v1/verify-email { email, code: "847291" }
→ validateApiKey
→ verifyOtp("verify", "proj_xyz", "priya@gmail.com", "847291")
   → Redis GET otp:verify:proj_xyz:priya@gmail.com → "847291"
   → String("847291") === "847291" → MATCH
   → Delete both the OTP key and attempt counter
   → Return "ok"
→ UPDATE users SET emailVerified=true WHERE email='priya@gmail.com' AND projectId='proj_xyz'
→ Fire user.email_verified webhook
```

**Why OTP in Redis and not in the database?**
OTPs live for 10 minutes and then die. If you stored them in PostgreSQL:
- You'd have millions of dead rows accumulating
- You'd need a cleanup job running constantly
- Redis handles expiry automatically via TTL — it's built for exactly this

---

### Step 7: Priya Forgets Her Password

```
POST /api/v1/forgot-password { email: "priya@gmail.com" }
→ validateApiKey
→ Generate OTP: "394872"
→ Store in Redis: otp:reset:proj_xyz:priya@gmail.com → TTL 10 min
→ Send password reset email
(Note: even if priya@gmail.com doesn't exist, we return 200 — prevents email enumeration)

Priya enters the code + new password:
POST /api/v1/reset-password { email, code, newPassword }
→ verifyOtp → "ok"
→ bcrypt.hash(newPassword, 12)
→ UPDATE users SET passwordHash=newHash
→ invalidateAllUserSessions(userId)
   → Scans Redis for all session:* keys belonging to this userId
   → Deletes them all → Priya is logged out everywhere
→ Fire user.password_reset webhook
```

**Why log out everywhere after password reset?**
If someone hijacked Priya's account and changed her password, Priya resets it and the hacker's session is immediately killed. This is critical security.

---

## 3. Dashboard — How a Developer Manages Projects

Arjun logs into the Sash Dashboard at `/dashboard`. Here he can:

### View All Projects
```
GET /api/dashboard/projects
→ Server calls auth() from NextAuth — checks the JWT cookie
→ Gets Arjun's ProjectOwner ID from the session
→ SELECT * FROM projects WHERE ownerId = 'arjun_id'
→ Returns list of projects
```

### View Users of a Project
```
GET /api/dashboard/projects/[id]/users
→ Verify Arjun owns this project (security check!)
→ SELECT * FROM users WHERE projectId = 'proj_xyz' ORDER BY createdAt DESC
→ Paginated results with email, verified status, active status, join date
```

**Why check ownership?** Without this, any logged-in developer could access another developer's user list by guessing a project ID. This is called **Broken Object Level Authorization (BOLA)** — one of the most common API security bugs.

### Rotate API Key
```
POST /api/dashboard/projects/[id]/rotate-key
→ Generate new API key
→ UPDATE projects SET apiKey = 'sash_live_newkey...'
→ Arjun's old SDK calls immediately stop working
→ He updates the SDK configuration with the new key
```

### Set Webhook URL
```
POST /api/dashboard/projects/[id]
→ Update projects SET webhookUrl = 'https://arjun-backend.com/webhooks'
```

---

## 4. Redis TTL, Sessions, and Rate Limiting

### What is Redis?

**Redis** is an in-memory database. Unlike PostgreSQL which writes to disk (slow but permanent), Redis keeps everything in RAM (fast but needs TTL for cleanup). Think of it like:
- PostgreSQL = a filing cabinet (permanent, organized, slow to fetch)
- Redis = a whiteboard (fast to read/write, but you erase it after use)

### TTL (Time To Live)

**TTL** is an expiry timer on a Redis key. When TTL reaches 0, Redis automatically deletes the key.

```
redis.set("session:f8a3bc...", data, { ex: 604800 })
                                              ↑
                                      604800 seconds = 7 days
```

After 7 days with no activity, the session is gone. The user has to log in again.

### Sliding Window Sessions

When Priya visits a page and the SDK calls `GET /api/v1/me`:
```
getSession(sessionId) → found → still valid
refreshSession(sessionId) → redis.expire("session:f8a3bc...", 604800)
```

The TTL resets to 7 days again. So if Priya uses the app every day, she's never logged out. If she disappears for 7+ days, the session expires and she logs in fresh. This is called a **sliding window** — the expiry clock keeps restarting as long as the user is active.

### Rate Limiting — How It Works

**Rate limiting** is a bouncer at a club. After a certain number of requests from the same person, you say "slow down, come back later."

The implementation uses Redis's atomic INCR command:

```
Request 1 from IP 103.12.4.5:
  redis.incr("rate_limit:proj_xyz:103.12.4.5") → returns 1
  Since count is 1 (first time): redis.expire(key, 60) ← sets 60s window
  1 <= 10 → ALLOWED

Request 2:  counter → 2 → ALLOWED
...
Request 10: counter → 10 → ALLOWED
Request 11: counter → 11 → 11 > 10 → BLOCKED → return 429

After 60 seconds: Redis auto-deletes the key. Counter resets to 0.
```

**Why atomic INCR?** If two requests arrive at the exact same millisecond and you used GET → check → SET, both could read "9" and both think they're the last allowed request — but you'd let 11 through. `INCR` is a single operation that can't be interrupted. This is **race condition** prevention.

**Why namespace by projectId?** A rate limit on Arjun's project shouldn't affect requests to Bob's project. IP `103.12.4.5` gets separate limits for each project it calls.

---

## 5. Wrong API Key Scenarios

### Scenario 1: Missing Authorization Header
```
Request: POST /api/v1/signup (no Authorization header)
→ validateApiKey reads req.headers.get("authorization") → null
→ throw ApiKeyError("Missing Authorization header", 401)
→ Response: 401 { error: "Missing Authorization header. Expected: Bearer <api_key>" }
```

### Scenario 2: Malformed Header
```
Request with: Authorization: "sash_live_abc123" (no "Bearer " prefix)
→ authHeader.startsWith("Bearer ") → false
→ throw ApiKeyError → 401
```

### Scenario 3: Key Doesn't Exist
```
Request with: Authorization: "Bearer sash_live_fakekeynotindb"
→ prisma.project.findUnique({ where: { apiKey: "sash_live_fakekeynotindb" } })
→ Returns null (no project with this key)
→ throw ApiKeyError("Invalid API key", 401)
```

### Scenario 4: Valid Key but Deleted Project
Same as Scenario 3 — if the project was deleted, the row doesn't exist, so the key is simply invalid.

### Scenario 5: Using the Wrong Project's Key
```
Request to sign up a user with Project A's key, but sending Project B's data
→ The key is valid → finds Project A
→ All operations run under Project A's projectId
→ The user ends up in Project A's namespace
→ This is correct behavior — it's the developer's responsibility to use the right key
```

**What error message do we return for invalid keys?**
Always the same generic "Invalid API key" — we never say "key doesn't exist" vs "key is malformed" because that extra info helps attackers narrow down what went wrong.

---

## 6. Webhooks — Architecture, Reliability, and Examples

### What is a Webhook?

A **webhook** is the internet's way of saying "I'll call you when something happens."

**Without webhooks (polling — bad):**
```
Arjun's server asks Sash every 5 seconds: "Did anyone sign up? Did anyone sign up? Did anyone sign up?"
→ Wasteful, slow, hammers the API
```

**With webhooks (event-driven — good):**
```
Sash tells Arjun's server immediately when someone signs up
→ One instant notification, zero waste
```

### Real Scenario: Arjun Wants to Welcome New Users

Arjun wants to send a personalized "Welcome to BookReview!" email from his own backend when a user signs up.

**Without webhooks:** Arjun can't — he doesn't know when signups happen.

**With webhooks:**
1. Arjun sets his webhook URL in the Sash dashboard: `https://arjun-app.com/webhooks/sash`
2. When Priya signs up, Sash fires:

```
POST https://arjun-app.com/webhooks/sash
Headers:
  Content-Type: application/json
  X-Sash-Signature: sha256=a3f8b2c9...
  User-Agent: Sash-Webhook/1.0
Body:
{
  "event": "user.signup",
  "projectId": "proj_xyz",
  "user": { "id": "user_abc123", "email": "priya@gmail.com" },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

3. Arjun's server receives this, adds Priya to his own database, sends her a welcome email.

### Events Sash Fires

| Event | When |
|---|---|
| `user.signup` | New user created |
| `user.login` | User logs in |
| `user.logout` | User logs out |
| `user.email_verified` | Email OTP verified |
| `user.password_reset` | Password changed |

### How Arjun Verifies the Webhook is Really from Sash

Anyone on the internet could POST fake data to `arjun-app.com/webhooks/sash`. We need to prove it's really Sash.

**HMAC-SHA256 Signing** (HMAC = Hash-based Message Authentication Code):

```
Sash signs the payload:
  secret = "webhook-secret-arjun-and-sash-both-know"
  signature = HMAC-SHA256(secret, JSON.stringify(payload))
  → "sha256=a3f8b2c9..."
  Header: X-Sash-Signature: sha256=a3f8b2c9...

Arjun's server verifies:
  expectedSig = HMAC-SHA256(secret, rawBodyString)
  if (req.headers['x-sash-signature'] !== expectedSig) → reject 401
  else → process it
```

Think of it like a wax seal on an envelope. Only someone who knows the secret wax stamp can create a valid seal. If the seal doesn't match, the letter was tampered with.

### Why Fire-and-Forget? Why Not Wait for a Response?

```javascript
// In the signup route:
dispatchWebhook(project, "user.signup", { id: user.id, email: user.email });
// Notice: NO "await" before dispatchWebhook
```

**Why no await?**

Priya is waiting for her signup to complete. If Arjun's webhook endpoint is slow (or down), she'd be sitting on a loading spinner until it times out. That's a terrible user experience.

The webhook has a 10-second timeout internally — but the signup response returns instantly. The webhook fires in the background. If it fails, it logs an error but Priya's account is already created.

### Are Webhooks Reliable?

**Honest answer: No, they're best-effort in the current implementation.**

What's built:
- Fire-and-forget with a 10s timeout
- Errors are logged but not retried

**What's missing (and you can mention this as a future improvement):**
- Retry queue (if delivery fails, try again in 30s, 5min, 30min)
- Webhook delivery log in the dashboard (so Arjun can see if any failed)
- Dead-letter queue for permanently failed webhooks

**How to handle this as a developer using Sash:** Design your webhook handler to be **idempotent** — the same event arriving twice shouldn't cause duplicate records. Check if the user already exists before creating them.

---

## 7. Multi-Tenancy — What It Is and How You Built It

### What is Multi-Tenancy?

**Multi-tenancy** means one system serves multiple customers (tenants) while keeping their data completely separate.

**Real-world analogy:** An apartment building. 50 families share the same building (same infrastructure), but each apartment is private — you can't walk into your neighbor's apartment.

Without multi-tenancy, you'd need 50 separate buildings (50 separate servers, databases, etc.) — extremely expensive.

### How Sash Implements Multi-Tenancy

**The key is one simple database constraint:**

```sql
UNIQUE (email, projectId)
```

**What this means:**
- `priya@gmail.com` in Arjun's BookReview app = one User row with `projectId = "proj_xyz"`
- `priya@gmail.com` in Bob's TravelApp = a completely separate User row with `projectId = "proj_abc"`

These two Priyas don't know each other. They have different passwords, different session histories, different verification status.

**Scenario showing why this matters:**

```
Priya signs up to BookReview:
  INSERT INTO users (email='priya@gmail.com', passwordHash=X, projectId='proj_xyz')
  
Priya signs up to TravelApp (different app, also uses Sash):
  INSERT INTO users (email='priya@gmail.com', passwordHash=Y, projectId='proj_abc')

No conflict! Two separate accounts.

If we didn't have the projectId column, the second INSERT would fail
because email='priya@gmail.com' already exists. That would be broken.
```

### Every Query Must Include projectId

Every database query for users looks like:
```sql
WHERE email = 'priya@gmail.com' AND projectId = 'proj_xyz'
```

If you forgot the `AND projectId = 'proj_xyz'`, you might accidentally find Priya from TravelApp when looking for BookReview's Priya. This would be a catastrophic data leak.

In the code, the API key is the gate:
```
validateApiKey(req) → returns the full Project object
→ project.id is now known
→ ALL subsequent queries use this projectId
```

### Redis is Also Namespaced by projectId

OTP keys: `otp:verify:proj_xyz:priya@gmail.com`
Rate limits: `rate_limit:proj_xyz:103.12.4.5`

If IP `103.12.4.5` is rate-limited on BookReview, it doesn't affect its calls to TravelApp.

---

## 8. Redis Sessions vs JWT — Deep Comparison

### What is JWT?

**JWT (JSON Web Token)** is like a stamped ID card you carry in your pocket. The server signs it cryptographically when you log in. On every request, you show this card and the server just verifies the signature — no database lookup needed.

```
JWT looks like: xxxxx.yyyyy.zzzzz
Three parts separated by dots:
- Header: algorithm type
- Payload: { userId, email, exp: 1234567890 }
- Signature: HMAC-SHA256(header + payload, secret)
```

### What is a Redis Session?

A Redis session is like a **hotel key card**. The card itself is meaningless — it's just a random number. The hotel's computer (Redis) knows which room that card opens.

```
Session flow:
Login → server generates random ID → stores { userId, projectId } in Redis → gives random ID to browser as cookie
Later request → browser sends cookie → server looks up Redis → finds userId → processes request
```

### Side-by-Side Comparison

| Feature | JWT | Redis Session (Sash) |
|---|---|---|
| **Server storage needed?** | No — self-contained | Yes — Redis |
| **Can you revoke instantly?** | No (see below) | Yes — just delete the Redis key |
| **Database hit per request?** | No — just crypto verify | Yes — one Redis GET |
| **Scales horizontally?** | Easily — stateless | Yes, if Redis is shared (Upstash) |
| **User can be logged out by admin?** | Extremely difficult | Trivial — delete their sessions |
| **Session data size?** | Grows with payload | Fixed: just `{userId, projectId}` |
| **After password reset, old sessions?** | Still valid until expiry | Instantly killed |

### The Fatal Flaw of JWT: Revocation

This is the most important interview point.

**Scenario:** Priya's laptop is stolen. The thief has her JWT token. In a JWT system:
- The token is valid until its expiry (e.g., 7 days)
- Priya resets her password
- The thief's JWT is STILL VALID because the server has no way to check if a JWT was "cancelled"
- The thief can use the old token for 7 more days

**In Sash's Redis system:**
- Priya resets her password
- `invalidateAllUserSessions(userId)` scans Redis and deletes ALL sessions for Priya
- The thief's session key is gone from Redis
- Their next request gets a 401 — immediately locked out

**How JWT workarounds this (but it's ugly):**
- Short expiry (15 minutes) + refresh tokens → more complex, more requests
- Token blacklist in Redis → but now you're querying Redis anyway (losing the stateless advantage)
- Sash just chose Redis sessions and gets instant revocation for free

### How Much Does Redis Reduce Database Load?

With JWT: 0 database hits per authenticated request
With Redis sessions: 1 Redis GET per authenticated request (not 1 PostgreSQL query)

Redis is in-memory, so the GET takes ~1ms. PostgreSQL queries typically take 5-50ms. Sessions are essentially free performance-wise.

The only PostgreSQL hit happens when we need actual user data (e.g., to check `isActive` or return user details) — not for every single request.

---

## 9. How 2FA / OTP Works in This System

**Note:** Sash implements OTP for email verification and password reset, not as a mandatory second factor (2FA proper). Here's how it works and how it could become full 2FA.

### What is OTP?

**OTP (One-Time Password)** is a code that:
- Works exactly once
- Expires after a time limit (here: 10 minutes)
- Can't be guessed easily (random 6 digits)

Think of it like a scratch card. Once scratched, it's used up. It expires if you wait too long.

### The OTP Flow (Email Verification)

```
1. User requests verification:
   → generateOtp() = "847291" (random number between 100000-999999)
   → storeOtp("verify", projectId, email, "847291")
      → Redis SET otp:verify:proj_xyz:priya@gmail.com "847291" EX 600
      → Redis SET resets attempt counter to 0
   → Email sent with the code

2. User submits the code:
   → verifyOtp("verify", projectId, email, "847291")
   → Redis GET otp:verify:proj_xyz:priya@gmail.com → returns "847291"
   → String("847291") === "847291" → MATCH
   → Delete the OTP key (can't use it again)
   → Delete the attempt counter
   → Return "ok"

3. Update database:
   → UPDATE users SET emailVerified=true WHERE email=... AND projectId=...
```

### Brute-Force Protection

What if a hacker tries to guess "000000", "000001", "000002"...?

```
Each wrong attempt:
→ redis.incr("otp_attempts:verify:proj_xyz:priya@gmail.com") → 1
→ redis.incr(...) → 2
...
→ redis.incr(...) → 5

On the 5th wrong attempt:
→ Delete the OTP key entirely (otp:verify:...)
→ Delete the attempt counter
→ Return "locked"

Now the hacker can't guess anymore. The OTP is gone.
The user must request a fresh code to try again.
```

**Why 5 attempts?** With 6 random digits (1,000,000 possible codes), the probability of guessing correctly in 5 tries is 0.0005%. Effectively impossible.

### How This Becomes True 2FA

Currently OTP is used for email verification and password reset. To add mandatory 2FA:
1. After login succeeds, don't return the session immediately
2. Store a "pending-2fa" state in Redis
3. Send an OTP to the user's phone/email
4. The user submits the OTP
5. Only then create the full session

The OTP infrastructure is already built — adding 2FA is just a flow change, not a new system.

---

## 10. How Passwords Are Kept Safe

### Step 1: The User Types a Password

Priya types `"mypassword123"`.

This is sent to the server over **HTTPS** (encrypted in transit). No one intercepting the network traffic can read it.

### Step 2: Validation

Before hashing, Zod validates:
- Minimum 8 characters (too short = easy to brute-force)
- Maximum 72 characters (bcrypt's hard limit — characters after 72 are silently ignored)
- At least 1 letter
- At least 1 number

### Step 3: Hashing with bcrypt

**Hashing** converts a password into a scrambled string. It's:
- **One-way**: You can't reverse "hash back to password"
- **Deterministic**: Same input always gives same output
- **Slow on purpose**: bcrypt is designed to be slow so hacking is expensive

```javascript
const passwordHash = await bcrypt.hash("mypassword123", 12);
// Output: "$2a$12$K7TBGGmqt3./HzNbQ7bKoeEV1CaDYBjnF..."
```

**The `12` is the cost factor.** bcrypt runs 2^12 = 4096 rounds of hashing internally. This makes each hash take ~300ms. A user logging in doesn't notice 300ms, but a hacker trying to crack 1 million passwords would need 300ms × 1,000,000 = 83 hours on one computer.

### Step 4: Salt

The long string `$2a$12$K7TBGGmqt3./HzNbQ7bKoe` contains a **salt** — random bytes added to the password before hashing. 

**Why salt?** Without salt, two users with the same password would have identical hashes. A hacker with a list of pre-computed "common password → hash" pairs (**rainbow tables**) could instantly crack millions of accounts.

With a unique salt per user, every hash is different, even for identical passwords.

### Step 5: Verification on Login

```javascript
const match = await bcrypt.compare("mypassword123", storedHash);
// bcrypt extracts the salt from storedHash, re-hashes the input, compares
// Returns: true or false
```

The original password is NEVER stored — not even in logs. If the database is breached, the attacker gets only the hash, which is computationally infeasible to reverse.

### Step 6: Password Reset Kills All Sessions

After a password change:
```javascript
await invalidateAllUserSessions(userId);
```

This scans Redis for every `session:<id>` where the payload's `userId` matches, and deletes them all. Priya is logged out everywhere.

### Disposable Email Blocking

On signup, the email domain is checked against a list of 3,500+ known throwaway email services (mailinator.com, guerrillamail.com, etc.). These are rejected with a 422 error. This prevents abuse like creating unlimited test accounts.

---

## 11. Complete System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER'S BROWSER                         │
│                                                                     │
│   Dashboard UI (Next.js)                                            │
│   localhost:3000/dashboard                                          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SASH SERVER (Next.js)                        │
│                        Deployed on Vercel                           │
│                                                                     │
│  ┌──────────────────┐    ┌─────────────────────────────────────┐   │
│  │  /api/auth/*     │    │  /api/v1/*  (Public API)            │   │
│  │  NextAuth        │    │                                     │   │
│  │  Dashboard login │    │  POST /signup                       │   │
│  │  for Developers  │    │  POST /login                        │   │
│  └──────────────────┘    │  POST /logout                       │   │
│                          │  GET  /me                           │   │
│  ┌──────────────────┐    │  POST /send-verification            │   │
│  │  /api/dashboard/*│    │  POST /verify-email                 │   │
│  │  Project CRUD    │    │  POST /forgot-password              │   │
│  │  User directory  │    │  POST /reset-password               │   │
│  └──────────────────┘    └─────────────────────────────────────┘   │
│                                                                     │
│  lib/ (shared business logic)                                       │
│  api-key.ts  session.ts  otp.ts  webhook.ts  rate-limit.ts         │
│  validations.ts  prisma.ts  redis.ts  email.ts                      │
└──────────────┬──────────────────────────────┬───────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐        ┌──────────────────────┐
│   PostgreSQL (Neon)  │        │   Redis (Upstash)    │
│                      │        │                      │
│  ProjectOwner        │        │  session:<id>        │
│  Project             │        │  otp:verify:...      │
│  User                │        │  otp:reset:...       │
│                      │        │  otp_attempts:...    │
│  Permanent data      │        │  rate_limit:...      │
│  Relationships       │        │                      │
│  Queries             │        │  Ephemeral data      │
└──────────────────────┘        │  In-memory fast      │
                                │  Auto-expiry (TTL)   │
                                └──────────────────────┘
                                            ▲
                                            │
┌─────────────────────────────────────────────────────────────────────┐
│                     END-USER'S BROWSER                              │
│                                                                     │
│   Developer's App (any React app)                                   │
│   localhost:5173 (demo: demo-client)                                │
│                                                                     │
│   <SashProvider apiKey="sash_live_...">                             │
│     <SignIn />    <SignUp />    <ForgotPassword />                   │
│   </SashProvider>                                                   │
│                                                                     │
│   SDK (@septic/sdk)                                                 │
│   → Wraps fetch calls to /api/v1/*                                  │
│   → Manages user state in React Context                             │
│   → Sends Authorization: Bearer <apiKey> on every request          │
│   → Reads/writes sash_session cookie automatically                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Webhook POST (event-driven)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   DEVELOPER'S BACKEND SERVER                        │
│                                                                     │
│   POST /webhooks/sash                                               │
│   → Verifies X-Sash-Signature header                                │
│   → Saves user data to developer's own database                     │
│   → Sends welcome emails, triggers business logic, etc.             │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
1. Developer registers → creates ProjectOwner in PostgreSQL
2. Developer creates project → gets API key (sash_live_...)
3. Developer's SDK uses API key → every request is tenant-identified
4. End-user signs up → User created in PostgreSQL (scoped to projectId)
5. Session created → stored in Redis with 7-day TTL
6. Session cookie → set on end-user's browser (HttpOnly)
7. Subsequent requests → cookie auto-sent → Redis lookup → user identified
8. OTPs → stored in Redis with 10-min TTL → verified → deleted
9. Webhooks → fired async → signed with HMAC → delivered to developer
```

---

## 12. What's Unique About What You Built

### 1. True Multi-Tenant Auth with Compound Uniqueness
Most tutorials show single-tenant auth. You built a system where the same email can exist as separate identities across different projects, enforced at the database level with `@@unique([email, projectId])`. This is production-grade multi-tenancy.

### 2. Two Completely Separate Auth Systems in One Codebase
You distinguished between:
- Developers using the dashboard (NextAuth JWT)
- End-users authenticating via API (custom Redis sessions)

This separation of concerns is something most junior devs miss — they'd use one auth system for everything and create security holes.

### 3. Custom Session Management with Sliding Window TTL
Instead of accepting NextAuth for everything, you built your own Redis-backed session layer with proper:
- Instant revocation
- Sliding window (active users never expire)
- Full-device logout on password reset
- SCAN-based invalidation (respects Redis production limits)

### 4. SDK as an npm Package with Bundled Styles
You published `@septic/sdk` — a complete drop-in authentication SDK with:
- Pre-built React components (SignIn, SignUp, ForgotPassword)
- Headless hook (useSash) for custom UIs
- Vanilla CSS (intentionally, to avoid Tailwind collisions)
- CJS + ESM + TypeScript types (supports all modern bundlers)

### 5. Signed Webhooks
HMAC-SHA256 signing is how Stripe, GitHub, and Twilio do webhooks. You implemented the same production pattern — including the `sha256=` prefix format.

### 6. Disposable Email Blocking at Validation Layer
You block 3,500+ throwaway email domains before the request even hits the database. This prevents abuse without any database queries.

### 7. Atomic Rate Limiting
Using Redis INCR instead of the common GET → check → SET anti-pattern prevents race conditions in concurrent high-traffic scenarios.

---

## 13. How Can This Be Made Better

These are your future improvements — mentioning them shows senior-level thinking.

### Short-term
1. **Webhook retry queue** — Use a queue (Bull, BullMQ) to retry failed webhook deliveries with exponential backoff
2. **Webhook delivery logs** — Show developers in the dashboard which events were delivered, which failed
3. **Session reverse index** — Instead of scanning all Redis keys on logout, store `userId → Set<sessionId>` so invalidation is O(1) instead of O(n)
4. **OAuth providers** — Add "Sign in with Google/GitHub" via the same API

### Medium-term
5. **True 2FA** — Mandatory second factor (TOTP via Google Authenticator, or SMS) — the OTP infrastructure is already there
6. **Magic links** — Passwordless email login — Resend + a signed URL with TTL
7. **Audit logs** — Record every auth event with timestamp, IP, device info — stored in PostgreSQL
8. **API key scoping** — Different keys for read-only vs full access
9. **Rate limit per user** (not just IP) — Prevent one user from making too many requests even across multiple IPs

### Long-term
10. **Webhook idempotency keys** — Each event gets a unique ID so developers can detect duplicates
11. **Multi-region Redis** — For global low-latency session reads
12. **Dashboard analytics** — DAU/MAU graphs, login frequency, verification rates
13. **GDPR tooling** — One-click user data export/deletion per project

---

## 14. Database Schema Deep Dive

### The Three Tables

```prisma
ProjectOwner (table: project_owners)
  id           String  @id @default(cuid())    ← unique ID, auto-generated
  email        String  @unique                 ← one account per email
  passwordHash String                          ← bcrypt hash, never plaintext
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt             ← auto-updated on every save

Project (table: projects)
  id         String  @id @default(cuid())
  name       String                            ← "BookReview", "TravelApp", etc.
  apiKey     String  @unique                   ← sash_live_<64 hex> — the tenant gate
  webhookUrl String?                           ← optional, null if not set
  ownerId    String                            ← foreign key → ProjectOwner.id
  
  @@index([apiKey])                            ← fast lookup on every API request

User (table: users)
  id           String  @id @default(cuid())
  email        String
  passwordHash String
  projectId    String                          ← foreign key → Project.id
  emailVerified Boolean @default(false)
  isActive      Boolean @default(true)
  
  @@unique([email, projectId])                 ← THE MULTI-TENANCY CONSTRAINT
  @@index([projectId])                         ← fast lookup "all users in this project"
```

### Why CUID instead of UUID?

**CUID** (Collision-resistant Unique ID) looks like `clh4g7eov0000qzrmklmb4kcg`.
**UUID** looks like `550e8400-e29b-41d4-a716-446655440000`.

CUIDs are:
- Time-ordered (you can sort them chronologically without a `createdAt` column)
- URL-safe (no hyphens that could break URLs)
- Collision-resistant across distributed systems

### The Cascade Delete

```prisma
owner Project @relation(fields: [ownerId], references: [id], onDelete: Cascade)
```

If Arjun deletes his Sash account (ProjectOwner), all his Projects are auto-deleted. If a Project is deleted, all its Users are auto-deleted. This prevents orphaned data.

### Why a Separate `@@index([apiKey])`?

Every single API request does:
```sql
SELECT * FROM projects WHERE apiKey = 'sash_live_...'
```

Without an index, PostgreSQL scans every row in the `projects` table. With a unique index, it's an instant O(log n) lookup. At 10,000 projects and 1,000 requests/second, the index is the difference between 1ms and 10,000ms.

---

## 15. Every Interview Question — With Answers

### Architecture Questions

**Q: Why not use NextAuth for end-user authentication too?**
A: NextAuth is designed for dashboard/app-level login where you control the UI. End-user auth needs to work across different origins (CORS), with API keys identifying the tenant, and with custom session logic (multi-tenant scoping, instant revocation). NextAuth's abstractions would fight against all of these requirements.

**Q: How do you handle concurrent requests from the same user?**
A: Redis operations like INCR are atomic. For session reads, multiple concurrent requests can all hit `getSession()` simultaneously — Redis handles concurrent reads natively. For session creation on login, each login generates a new unique sessionId, so there's no write conflict.

**Q: What happens if Redis goes down?**
A: Every authenticated request (GET /me) would fail with a 500 error — no users could log in or verify their session. This is the main availability risk of stateful sessions. Mitigation: Upstash provides high availability with automatic failover. A future improvement is to have a fallback (e.g., a signed, short-lived JWT for the exact scenario where Redis is unreachable).

**Q: How does the SDK know which Sash server to call?**
A: The `SashProvider` accepts a `baseUrl` prop (defaults to production Sash URL). For local development, you'd point it at `localhost:3000`. The API key in the Authorization header identifies the tenant regardless of which URL is used.

**Q: Why is `apiKey` indexed separately with `@@index([apiKey])` when it's already `@unique`?**
A: A `@unique` constraint in Prisma/PostgreSQL automatically creates a unique index. The explicit `@@index([apiKey])` is actually redundant in this case — the unique constraint covers it. You can mention this honestly: it's belt-and-suspenders documentation, but functionally the unique constraint's index is already used.

**Q: What is CORS and how do you handle it?**
A: **CORS (Cross-Origin Resource Sharing)** is a browser security rule that blocks JavaScript from one domain (e.g., `localhost:5173`) calling an API on another domain (e.g., `localhost:3000`) unless the server explicitly allows it. In `next.config.ts`, we add `Access-Control-Allow-Origin: http://localhost:5173` (from `ALLOWED_ORIGIN` env var) to all `/api/*` responses. This allows the SDK running in the developer's app to call Sash's API.

### Security Questions

**Q: What prevents someone from stealing another developer's API key from the frontend?**
A: API keys are intentionally public in the sense that they're included in client-side JavaScript. This is the same model as Firebase, Supabase, and Clerk. The key only allows access to public auth operations (signup, login) — it cannot read data, delete users, or access other projects. Sensitive operations are locked to the dashboard (server-side, NextAuth-protected).

**Q: How do you prevent CSRF attacks?**
A: The `SameSite=Strict` cookie attribute means the `sash_session` cookie is only sent on same-site requests. A malicious website that tricks a user into clicking a form can't make cross-site requests that include the cookie.

**Q: How do you prevent SQL injection?**
A: Prisma uses parameterized queries — user input is never concatenated into SQL strings. This is automatic and guaranteed by the ORM.

**Q: How do you prevent XSS stealing the session cookie?**
A: The `HttpOnly` flag on `sash_session` means JavaScript cannot access it via `document.cookie`. Even if an attacker injects malicious JavaScript into the page, they can't steal the session.

**Q: What is timing-safe comparison and does this system use it?**
A: bcrypt.compare() handles timing-safe password comparison internally. For OTP comparison, we compare strings directly (`String(stored) === code`) — a potential improvement is using `crypto.timingSafeEqual()` to prevent timing attacks on OTP verification.

**Q: What if someone intercepts the OTP email?**
A: If an attacker controls the email inbox, the OTP won't help — they'll get the code. OTP via email assumes the user controls their email account. For higher security, SMS OTP or TOTP (Google Authenticator) are stronger alternatives, since those don't go through email servers.

### Database Questions

**Q: Why PostgreSQL over MongoDB for this project?**
A: Auth data is highly relational: ProjectOwner → Project → User. These relationships benefit from foreign keys, cascade deletes, and ACID transactions (all-or-nothing operations). MongoDB is document-oriented and would require manual relationship management.

**Q: What happens if two signup requests for the same email come in at the exact same millisecond?**
A: PostgreSQL's `@@unique([email, projectId])` constraint is enforced at the database level. One request wins the INSERT, the other gets a unique constraint violation error, which Prisma surfaces as a P2002 error code. The route catches this and returns 409 Conflict. This is race-condition safe because the database handles it atomically.

**Q: Why `@default(now())` for `createdAt` instead of setting it in application code?**
A: The database sets the timestamp — it's guaranteed to be accurate regardless of server clock drift or timezone mismatches across multiple server instances. Application code timestamps can vary if servers have slightly different clocks.

### SDK Questions

**Q: Why vanilla CSS instead of CSS Modules or styled-components?**
A: npm packages can't safely use CSS Modules (requires bundler config on the consumer's side) or styled-components (requires the consumer to have it installed). Vanilla CSS with scoped class names (`.sash-button`) and CSS variables (`--sash-brand`) works universally. `tsup --injectStyle` bundles the CSS into the JS bundle.

**Q: How does `useSash()` know the current user on page refresh?**
A: `SashProvider` runs a `useEffect` on mount that calls `GET /api/v1/me`. The browser automatically includes the `sash_session` cookie (it's HttpOnly but still automatically sent). If the session is valid in Redis, the server returns the user data. This completes before the app fully renders, preventing flash-of-unauthenticated-content.

**Q: What if the developer doesn't want to use your pre-built components?**
A: They use the `useSash()` hook directly, which exposes all auth functions (login, signup, logout, etc.). They build their own UI and call these functions. The pre-built components are just convenient wrappers around this hook.

---

## 16. How Interviewers Will Try to Trap You

### Trap 1: "So anyone can see your API key in the browser source code. Isn't that a huge security flaw?"

**The trap:** They want to see if you panic and admit the system is broken.

**The escape:** "Yes, the API key is visible in client-side code — that's intentional. This is the same model used by Firebase, Supabase, and Clerk. The key scopes requests to a tenant but only allows public auth operations. It cannot read the user list, delete accounts, or access other tenants. All admin operations are protected by the developer's server-side NextAuth session, which is never exposed to the browser."

---

### Trap 2: "What if Redis crashes? Your entire platform is down?"

**The trap:** They want to see if you've thought about availability.

**The escape:** "That's a real single-point-of-failure in the current architecture. Upstash provides automatic failover and replication, so downtime is extremely rare. For a production hardening, I'd add a fallback: on Redis unavailability, issue a short-lived signed JWT (maybe 5 minutes) that can be verified without Redis. This is a known tradeoff — stateful sessions give instant revocation but require Redis availability."

---

### Trap 3: "You fire webhooks without awaiting them. What if the event is lost?"

**The trap:** They want to see if you'll defend fire-and-forget blindly.

**The escape:** "You're right — the current implementation is best-effort. A webhook failure is logged but not retried. For production reliability, I'd add a retry queue (using BullMQ or a database-backed queue) with exponential backoff — try again after 30 seconds, 5 minutes, 30 minutes, then give up and alert the developer. Stripe and GitHub use this exact model. I chose fire-and-forget for the MVP to ship fast; the retry infrastructure is a known Phase 2 item."

---

### Trap 4: "Your `invalidateAllUserSessions` scans all Redis keys — doesn't that cause problems at scale?"

**The trap:** They know about Redis KEYS performance issues.

**The escape:** "SCAN is used, not KEYS — SCAN is non-blocking and cursor-based, processing 100 keys at a time without blocking other Redis operations. It's O(n) over all session keys, which is fine for typical scale (thousands to low millions of sessions). At very high scale, I'd maintain a reverse index: a Redis Set for each userId containing their sessionIds. Then invalidation is O(m) where m is the number of that user's sessions — typically 1 to 5."

---

### Trap 5: "Why not just use an existing auth library like Passport.js?"

**The trap:** They want to challenge the "build vs buy" decision.

**The escape:** "Passport.js handles single-tenant authentication. Our core challenge is multi-tenancy — every request must be scoped to a specific project via an API key, and user identities must be isolated per project. That's not a solved problem in off-the-shelf libraries. The custom session management also gives us instant revocation, which JWT-based libraries don't offer. We do use NextAuth for dashboard auth, where it fits perfectly."

---

### Trap 6: "What prevents a developer from signing up with a disposable email to abuse the platform?"

**The trap:** Testing depth of your security thinking.

**The escape:** "We block 3,500+ known disposable email domains at the Zod validation layer — before any database hit. Additionally, rate limiting on signup prevents automated account creation. For higher-assurance scenarios, we could add email domain verification (check DNS MX records) or require a payment method before allowing more than one free project."

---

### Trap 7: "What's the difference between `emailVerified` not blocking login vs. a system that requires verification first?"

**The trap:** They want to understand your product thinking.

**The escape:** "We deliberately don't block login on email verification. Different apps have different UX requirements — some apps want to let users explore before verifying, others want to gate features. We expose `emailVerified` on the `/me` endpoint and via webhooks, so each developer can make this decision for their own app. We're the infrastructure layer, not the product layer. A Clerk-like platform that forced verification would be more opinionated than our target market needs."

---

## 17. How to Boast This Project

Use this language in the interview:

### Opening Line
> "I built a production-grade, multi-tenant authentication platform from scratch — it's essentially a lightweight Clerk or Auth0. Developers integrate it with a single API key and get signup, login, email verification, password reset, and event webhooks out of the box."

### The Technical Depth Angle
> "The most interesting engineering challenge was multi-tenancy. I built it so the same email can exist as completely separate identities across different developer projects — enforced at the database level with a compound unique constraint on `(email, projectId)`. Every query, every Redis key, every rate limit is scoped to a tenant."

### The Security Angle
> "I implemented five independent security layers: bcrypt password hashing with cost factor 12, Zod input validation with disposable email blocking, atomic Redis rate limiting, instant session revocation via Redis (unlike JWT which can't be revoked), and HMAC-SHA256 signed webhooks. Each layer independently stops a different class of attack."

### The SDK/DX Angle
> "I built a published npm package — `@septic/sdk` — that gives developers drop-in React components and a headless hook. I specifically chose vanilla CSS over Tailwind to prevent class-name collisions when the package is consumed in different environments, and built it with tsup to output CJS, ESM, and TypeScript declarations simultaneously."

### The Scale Awareness Angle
> "I made deliberate architectural choices with scale in mind. Redis SCAN instead of KEYS for session invalidation, atomic INCR for race-condition-safe rate limiting, fire-and-forget webhooks so auth responses are never blocked by slow downstream services, and a sliding window session TTL so active users are never unexpectedly logged out."

### When They Ask "What Would You Do Differently?"
> "I'd add a webhook retry queue from day one — BullMQ with exponential backoff, the way Stripe and GitHub handle it. I'd also maintain a reverse index `userId → Set<sessionId>` in Redis to make full-device logout O(1) instead of O(n). These were conscious MVP tradeoffs, not oversights."

---

*Good luck. You built something genuinely impressive — own it.*
