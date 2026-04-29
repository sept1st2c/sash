/**
 * POST /api/v1/login
 *
 * Authenticates an existing end-user and creates a new session.
 *
 * REQUIRED HEADER:
 *   Authorization: Bearer <sash_api_key>
 *
 * REQUEST BODY:
 *   { "email": "user@example.com", "password": "..." }
 *
 * RESPONSE (200):
 *   { "user": { "id", "email", "createdAt" }, "sessionId": "..." }
 *
 * ERRORS:
 *   401 — invalid API key OR invalid credentials (generic — never leak which)
 *   422 — invalid request body
 *   429 — rate limit exceeded
 *
 * SECURITY NOTE — User Enumeration:
 *   We return the SAME generic "Invalid credentials" message whether the email
 *   doesn't exist or the password is wrong. This prevents attackers from using
 *   the login endpoint to discover which emails are registered.
 *
 * FLOW:
 *   1. Validate API key → get Project
 *   2. Rate limit check
 *   3. Validate body
 *   4. Find user by email + projectId (404 → generic 401)
 *   5. Compare password with bcrypt
 *   6. Create session in Redis
 *   7. Fire user.login webhook (async)
 *   8. Set HTTP-only cookie + return user + sessionId
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { validateApiKey, ApiKeyError } from "@/lib/api-key";
import { rateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { dispatchWebhook } from "@/lib/webhook";
import { prisma } from "@/lib/prisma";
import {
  getIp,
  jsonError,
  jsonSuccess,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/middleware-helpers";

const INVALID_CREDENTIALS_MSG = "Invalid credentials."; // never be more specific

export async function POST(req: NextRequest) {
  // ── Step 1: Validate API key ─────────────────────────────────────────────
  let project;
  try {
    project = await validateApiKey(req);
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return jsonError(err.message, 401);
    }
    return jsonError("Internal server error", 500);
  }

  // ── Step 2: Rate limiting ────────────────────────────────────────────────
  const ip = getIp(req);
  const rateLimitKey = buildRateLimitKey(project.id, ip);
  const { allowed } = await rateLimit(rateLimitKey, 10, 60);

  if (!allowed) {
    return jsonError("Too many login attempts. Please try again later.", 429);
  }

  // ── Step 3: Parse + validate body ────────────────────────────────────────
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const { email, password } = body;

  if (!email || typeof email !== "string") {
    return jsonError("Email is required.", 422);
  }

  if (!password || typeof password !== "string") {
    return jsonError("Password is required.", 422);
  }

  // ── Step 4: Find user (project-scoped) ───────────────────────────────────
  const user = await prisma.user.findUnique({
    where: {
      email_projectId: {
        email: email.toLowerCase(),
        projectId: project.id,
      },
    },
  });

  // No user found → return generic error (don't leak user existence)
  if (!user) {
    return jsonError(INVALID_CREDENTIALS_MSG, 401);
  }

  // ── Phase 3: Check if account is active ──────────────────────────────────
  if (!user.isActive) {
    return jsonError("This account has been suspended.", 403);
  }

  // ── Step 5: Compare password ─────────────────────────────────────────────
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    return jsonError(INVALID_CREDENTIALS_MSG, 401);
  }

  // ── Step 6: Create session in Redis ──────────────────────────────────────
  const sessionId = await createSession(user.id, project.id);

  // ── Step 7: Fire webhook (best-effort, don't await) ───────────────────────
  dispatchWebhook(project, "user.login", { id: user.id, email: user.email });

  // ── Step 8: Set cookie and return response ───────────────────────────────
  const safeUser = {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
  const response = jsonSuccess({ user: safeUser, sessionId });
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

  return response;
}
