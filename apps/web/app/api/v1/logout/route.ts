/**
 * POST /api/v1/logout
 *
 * Destroys the current session — user is logged out immediately.
 *
 * NO header required (reads session from cookie or Bearer token).
 *
 * RESPONSE (200):
 *   { "success": true }
 *
 * ERRORS:
 *   400 — no session found in request
 *
 * FLOW:
 *   1. Read sessionId from cookie or Authorization header
 *   2. Delete session from Redis
 *   3. Clear the session cookie
 *   4. Return { success: true }
 *
 * NOTE: This is intentionally lenient — if the session doesn't exist
 * in Redis (already expired), we still return 200. Logout should always
 * succeed from the client's perspective.
 */

import { NextRequest } from "next/server";
import { deleteSession } from "@/lib/session";
import {
  getSessionIdFromRequest,
  jsonError,
  jsonSuccess,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/middleware-helpers";

export async function POST(req: NextRequest) {
  // ── Step 1: Get session ID ───────────────────────────────────────────────
  const sessionId = getSessionIdFromRequest(req);

  if (!sessionId) {
    return jsonError("No active session found.", 400);
  }

  // ── Step 2: Delete from Redis ────────────────────────────────────────────
  // Even if the key doesn't exist (already expired), this is a no-op — no error
  await deleteSession(sessionId);

  // ── Step 3: Clear cookie + return ────────────────────────────────────────
  const response = jsonSuccess({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0, // immediately expire the cookie
  });

  return response;
}
