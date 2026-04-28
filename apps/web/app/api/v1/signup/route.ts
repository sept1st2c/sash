/**
 * POST /api/v1/signup
 *
 * Creates a new end-user for a given project.
 *
 * REQUIRED HEADER:
 *   Authorization: Bearer <sash_api_key>
 *
 * REQUEST BODY:
 *   { "email": "user@example.com", "password": "..." }
 *
 * RESPONSE (201):
 *   { "user": { "id", "email", "createdAt" }, "sessionId": "..." }
 *
 * ERRORS:
 *   401 — invalid/missing API key
 *   409 — email already registered in this project
 *   422 — invalid request body
 *   429 — rate limit exceeded
 *
 * FLOW:
 *   1. Validate API key → get Project
 *   2. Rate limit check
 *   3. Validate body
 *   4. Check for duplicate email (project-scoped)
 *   5. Hash password (bcrypt, cost=12)
 *   6. Create User in DB
 *   7. Create session in Redis
 *   8. Fire user.signup webhook (async, no-op on failure)
 *   9. Set HTTP-only session cookie
 *   10. Return user + sessionId
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
  const { allowed } = await rateLimit(rateLimitKey, 10, 60); // 10 attempts / 60s

  if (!allowed) {
    return jsonError("Too many signup attempts. Please try again later.", 429);
  }

  // ── Step 3: Parse + validate body ────────────────────────────────────────
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const { email, password } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return jsonError("A valid email is required.", 422);
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return jsonError("Password must be at least 8 characters.", 422);
  }

  // ── Step 4: Check for duplicate email (project-scoped) ───────────────────
  const existingUser = await prisma.user.findUnique({
    where: {
      email_projectId: {
        email: email.toLowerCase(),
        projectId: project.id,
      },
    },
  });

  if (existingUser) {
    return jsonError("An account with this email already exists.", 409);
  }

  // ── Step 5: Hash password ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);

  // ── Step 6: Create User in DB ────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      projectId: project.id,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // ── Step 7: Create session in Redis ──────────────────────────────────────
  const sessionId = await createSession(user.id, project.id);

  // ── Step 8: Fire webhook (best-effort, don't await) ───────────────────────
  dispatchWebhook(project, "user.signup", { id: user.id, email: user.email });

  // ── Step 9 + 10: Set cookie and return response ──────────────────────────
  const response = jsonSuccess({ user, sessionId }, 201);
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);

  return response;
}
