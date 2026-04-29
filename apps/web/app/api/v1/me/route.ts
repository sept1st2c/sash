/**
 * GET /api/v1/me
 *
 * Returns the currently authenticated user's data.
 * This is the endpoint the SDK calls on page load to restore auth state.
 *
 * NO header required for API key — reads session from cookie or Bearer token.
 *
 * RESPONSE (200):
 *   { "user": { "id", "email", "createdAt" } }
 *
 * ERRORS:
 *   401 — no session, expired session, or user deleted from DB
 *
 * FLOW:
 *   1. Read sessionId from cookie or Authorization header
 *   2. Get session from Redis (null → 401)
 *   3. Fetch user from PostgreSQL by userId in session
 *   4. If user deleted from DB → 401
 *   5. Refresh session TTL (sliding window)
 *   6. Return sanitized user object
 */

import { NextRequest } from "next/server";
import { getSession, refreshSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getSessionIdFromRequest,
  jsonError,
  jsonSuccess,
} from "@/lib/middleware-helpers";

export async function GET(req: NextRequest) {
  // ── Step 1: Get session ID ───────────────────────────────────────────────
  const sessionId = getSessionIdFromRequest(req);

  if (!sessionId) {
    return jsonError("Unauthorized. No session provided.", 401);
  }

  // ── Step 2: Validate session in Redis ────────────────────────────────────
  const session = await getSession(sessionId);

  if (!session) {
    // Session expired or invalid — the client should clear their local state
    return jsonError("Unauthorized. Session expired or invalid.", 401);
  }

  // ── Step 3: Fetch user from DB ───────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  // ── Step 4: Guard — user was deleted or deactivated after session was created
  if (!user) {
    return jsonError("Unauthorized. User not found.", 401);
  }
  if (!user.isActive) {
    return jsonError("This account has been suspended.", 403);
  }

  // ── Step 5: Refresh session TTL (sliding window) ─────────────────────────
  // Active users stay logged in; inactive sessions naturally expire
  await refreshSession(sessionId);

  // ── Step 6: Return user ──────────────────────────────────────────────────
  return jsonSuccess({ user });
}
