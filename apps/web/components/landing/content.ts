/**
 * Copy for the Sash marketing landing page (`app/page.tsx`).
 *
 * Every claim here is checked against the actual source: the public
 * /api/v1/* routes, prisma/schema.prisma, lib/session.ts, lib/otp.ts,
 * lib/rate-limit.ts, lib/webhook.ts. Don't add features here (billing,
 * team seats, audit logs, webhook retry UI, admin password reset) that
 * aren't actually shipped. Sash is v0.1, Phase 5: real and working,
 * early stage, not enterprise-mature.
 */

export interface CtaLink {
  label: string;
  href: string;
}

export const heroContent: {
  eyebrow: string;
  headline: string;
  subhead: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
} = {
  eyebrow: "Auth-as-a-Service · v0.1 · Phase 5",
  headline: "Auth for your personal projects.",
  subhead:
    "Sash is a drop-in alternative to Clerk or Auth0. Sessions live in Redis, passwords are hashed with bcrypt, every user is scoped to a project by a database constraint, not a shared table and a filter. It's small enough to read end to end in an afternoon.",
  primaryCta: { label: "Create a project", href: "/register" },
  secondaryCta: { label: "Try the live demo", href: "#demo" },
};

export const problemSolutionItems: Array<{
  problem: string;
  solution: string;
  detail: string;
}> = [
  {
    problem: "Redis silently turns your OTP into a number.",
    solution: "Every comparison gets coerced back to a string first.",
    detail:
      "Upstash auto-parses numeric-looking strings on the way out of Redis, so a stored OTP \"123456\" comes back as the number 123456. A naive === check breaks silently. lib/otp.ts wraps the stored value in String() before comparing, every time.",
  },
  {
    problem: "A password reset endpoint that confirms an email exists is a leak.",
    solution: "forgot-password, send-verification, and login all answer the same way.",
    detail:
      "POST /api/v1/forgot-password and /api/v1/send-verification return the identical 200 message whether or not the account exists. POST /api/v1/login returns a generic \"Invalid credentials.\" for both a wrong password and a user that doesn't exist. Nothing to learn from probing any of the three.",
  },
  {
    problem: "Invalidating a user's sessions shouldn't mean scanning production Redis with KEYS.",
    solution: "invalidateAllUserSessions() walks the keyspace with SCAN instead.",
    detail:
      "KEYS blocks the whole Redis instance while it runs, and Upstash won't even let you call it in production. lib/session.ts uses a cursor-based SCAN, coercing Upstash's string cursor back to a number on every loop.",
  },
  {
    problem: "A dead webhook endpoint shouldn't be able to slow down a login.",
    solution: "Webhook delivery is fire and forget, on a 10 second timeout, never awaited.",
    detail:
      "lib/webhook.ts calls dispatchWebhook() without an await. Delivery gets an AbortSignal.timeout(10_000). Failures get logged and swallowed, never surfaced to the request. Your auth response never waits on someone else's server.",
  },
];

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  code: {
    filename: string;
    lines: string[];
  };
}

export const featureGridItems: FeatureItem[] = [
  {
    id: "multi-tenancy",
    title: "Real multi-tenancy",
    description:
      "User is unique on [email, projectId]. The same jane@example.com can be a fully independent row in two different projects: different password, different verification state, different sessions. No query ever crosses that line.",
    code: {
      filename: "prisma/schema.prisma",
      lines: [
        "model User {",
        "  email     String",
        "  projectId String",
        "  @@unique([email, projectId])",
        "}",
      ],
    },
  },
  {
    id: "sessions",
    title: "Redis sessions",
    description:
      "Sessions live in Redis, not a JWT you have to rotate. Seven day TTL, refreshed on every GET /api/v1/me call, so active users never get logged out mid session. Just an HttpOnly cookie.",
    code: {
      filename: "lib/session.ts",
      lines: [
        "await redis.setex(",
        "  `session:${sessionId}`,",
        "  60 * 60 * 24 * 7,",
        "  JSON.stringify({ userId, projectId })",
        ");",
      ],
    },
  },
  {
    id: "otp",
    title: "OTP with real lockout",
    description:
      "Email verification and password reset both run on 6 digit codes: 10 minute TTL, 5 attempt lockout that deletes the code and the attempt counter together. No unlimited guessing.",
    code: {
      filename: "lib/otp.ts",
      lines: [
        "const stored = await redis.get(key);",
        'if (String(stored) !== code) {',
        '  return "invalid";',
        "}",
      ],
    },
  },
  {
    id: "rate-limit",
    title: "Rate limiting that matters",
    description:
      "Signup and login are capped at 10 requests per 60 seconds, per project, per IP, through an atomic Redis INCR. Brute forcing a password returns a 429 before it costs you anything.",
    code: {
      filename: "lib/rate-limit.ts",
      lines: [
        "const count = await redis.incr(key);",
        "if (count === 1) await redis.expire(key, 60);",
        "if (count > 10) return { allowed: false };",
      ],
    },
  },
  {
    id: "webhooks",
    title: "HMAC signed webhooks",
    description:
      "user.signup, user.login, user.password_reset, and user.email_verified fire a signed POST to your webhookUrl. Verify it with a few lines of Node crypto and a shared secret.",
    code: {
      filename: "lib/webhook.ts",
      lines: [
        'const sig = crypto',
        '  .createHmac("sha256", secret)',
        "  .update(rawBody)",
        '  .digest("hex");',
        '// X-Sash-Signature: sha256=<sig>',
      ],
    },
  },
  {
    id: "dashboard",
    title: "A dashboard that does something",
    description:
      "Per project stats, an API key and webhook URL you can rotate, and a real end user directory. Suspend a user and every one of their sessions dies with them.",
    code: {
      filename: "app/dashboard/.../actions.ts",
      lines: [
        "await prisma.user.update({",
        "  where: { id: userId },",
        "  data: { isActive: false },",
        "});",
        "await invalidateAllUserSessions(userId);",
      ],
    },
  },
  {
    id: "sdk",
    title: "A drop-in React SDK",
    description:
      "@septic/sdk ships SignIn, SignUp, and ForgotPassword components plus a useSash() hook that restores your session on mount. Wrap your app once, you're done.",
    code: {
      filename: "layout.tsx",
      lines: [
        '<SashProvider apiKey={apiKey}>',
        "  <SignIn />",
        "  <SignUp />",
        "</SashProvider>",
      ],
    },
  },
  {
    id: "api-key",
    title: "One key, one tenant",
    description:
      "Every /api/v1/* route besides logout and me (which run off the end user's own session) is scoped by a single sash_live_ key. Validated first, before any other code runs.",
    code: {
      filename: "lib/api-key.ts",
      lines: [
        'const key = authHeader.slice(7).trim();',
        "const project = await prisma.project.findUnique({",
        "  where: { apiKey: key },",
        "});",
      ],
    },
  },
];

export const endpointItems: Array<{
  method: "GET" | "POST";
  path: string;
  auth: "API key" | "Session";
  description: string;
}> = [
  {
    method: "POST",
    path: "/api/v1/signup",
    auth: "API key",
    description:
      "Creates an end user account scoped to your project. Returns the user and a sessionId, sets the session cookie right away.",
  },
  {
    method: "POST",
    path: "/api/v1/login",
    auth: "API key",
    description:
      'Authenticates an end user. Wrong password or unknown email both get the same "Invalid credentials." No enumeration.',
  },
  {
    method: "POST",
    path: "/api/v1/logout",
    auth: "Session",
    description: "Destroys the session in Redis and clears the cookie. Works even if the session already expired.",
  },
  {
    method: "GET",
    path: "/api/v1/me",
    auth: "Session",
    description:
      "Fetches the current end user and slides the session's 7 day TTL forward. What SashProvider calls on mount to restore state.",
  },
  {
    method: "POST",
    path: "/api/v1/forgot-password",
    auth: "API key",
    description: "Starts a password reset. Returns the same message whether or not the email exists.",
  },
  {
    method: "POST",
    path: "/api/v1/reset-password",
    auth: "API key",
    description: "Verifies the 6 digit code and sets a new password. Invalidates every other session that user had open.",
  },
  {
    method: "POST",
    path: "/api/v1/send-verification",
    auth: "API key",
    description: "Sends a 6 digit email verification code. Same anti-enumeration guarantee as forgot-password.",
  },
  {
    method: "POST",
    path: "/api/v1/verify-email",
    auth: "API key",
    description: "Verifies the code and sets emailVerified to true on the user record. Fires user.email_verified.",
  },
];

export const architectureCopy: {
  multiTenancyIntro: string;
  pipelineSteps: string[];
  redisNamespaces: Array<{ pattern: string; ttl: string; description: string }>;
} = {
  multiTenancyIntro:
    "Every end user belongs to exactly one Project, and every User row is unique on [email, projectId]. That's the one constraint that makes multi-tenancy real instead of a promise. jane@example.com can sign up under Acme's project and Beta's project as two independent rows with different passwords, different verification state, different sessions. No query in the codebase ever looks up a User without a projectId.",
  pipelineSteps: [
    "validateApiKey(req) resolves the Bearer token to a Project. Every /api/v1/* route starts here.",
    "rateLimit(projectId, ip) is an atomic Redis INCR against rate_limit:<projectId>:<ip>, on signup and login.",
    "safeParse(schema, body) validates every request body with Zod before it touches business logic.",
    "The Prisma read or write happens, always scoped by projectId.",
    "jsonSuccess() or jsonError() sends back one consistent shape with generic error messages.",
    "dispatchWebhook() fires last and is never awaited, so a dead endpoint can't slow your users down.",
  ],
  redisNamespaces: [
    {
      pattern: "session:<sessionId>",
      ttl: "7 days, sliding",
      description: "Maps a session to { userId, projectId }. TTL refreshes on every GET /api/v1/me call.",
    },
    {
      pattern: "otp:<verify|reset>:<projectId>:<email>",
      ttl: "10 minutes",
      description: "The 6 digit code, namespaced per project and email so the same address in two projects gets independent codes.",
    },
    {
      pattern: "otp_attempts:<verify|reset>:<projectId>:<email>",
      ttl: "10 minutes",
      description: "Wrong guess counter. Both keys get deleted together after the 5th failed attempt.",
    },
    {
      pattern: "rate_limit:<projectId>:<ip>",
      ttl: "60 seconds",
      description: "The INCR counter behind the 10 request cap on signup and login, keyed per project.",
    },
  ],
};

export const footerContent: {
  tagline: string;
  links: CtaLink[];
} = {
  tagline: "Sash is v0.1. A real, working auth backend you can read top to bottom, not a promise of one.",
  links: [
    { label: "Features", href: "#features" },
    { label: "Architecture", href: "#architecture" },
    { label: "API", href: "#api" },
    { label: "Live demo", href: "#demo" },
    { label: "Sign in", href: "/login" },
    { label: "Create a project", href: "/register" },
  ],
};
