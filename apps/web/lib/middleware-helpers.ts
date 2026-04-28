/**
 * lib/middleware-helpers.ts
 *
 * Shared request/response utilities used across all API route handlers.
 * Centralizing these prevents copy-paste and ensures consistent error shapes.
 *
 * EXPORTED FUNCTIONS:
 *   getIp(req)                    → extracts client IP from request headers
 *   getSessionIdFromRequest(req)  → reads sessionId from cookie or Bearer header
 *   jsonError(message, status)    → returns standardized error NextResponse
 *   jsonSuccess(data, status?)    → returns standardized success NextResponse
 */

import { NextRequest, NextResponse } from "next/server";

// ─── IP Extraction ────────────────────────────────────────────────────────────

/**
 * getIp
 *
 * Extracts the client's real IP address. In production (Vercel), the real IP
 * comes from the X-Forwarded-For header set by the edge network.
 * Falls back to "unknown" if unavailable (e.g. local dev without proxy).
 */
export function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list; first IP is the client
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

// ─── Session ID Extraction ────────────────────────────────────────────────────

/**
 * getSessionIdFromRequest
 *
 * Reads the session ID from:
 *   1. The `sash_session` HTTP-only cookie (browser clients)
 *   2. The `Authorization: Bearer <sessionId>` header (SDK / server-side)
 *
 * Returns null if neither is present.
 */
export function getSessionIdFromRequest(req: NextRequest): string | null {
  // Prefer cookie (browser flow)
  const cookie = req.cookies.get("sash_session");
  if (cookie?.value) return cookie.value;

  // Fall back to Bearer token in Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    // Distinguish from API keys — session IDs are raw hex, not prefixed with "sash_live_"
    if (token && !token.startsWith("sash_live_")) {
      return token;
    }
  }

  return null;
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

/**
 * jsonError
 *
 * Returns a standardized error response.
 * Shape: { "error": "<message>" }
 */
export function jsonError(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * jsonSuccess
 *
 * Returns a standardized success response.
 * Shape: { ...data }
 */
export function jsonSuccess(
  data: Record<string, unknown>,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/**
 * SESSION_COOKIE_OPTIONS
 *
 * Shared cookie options applied to sash_session cookie:
 *   httpOnly  — prevents JavaScript (XSS) from reading the cookie
 *   secure    — only sent over HTTPS in production
 *   sameSite  — strict CSRF protection
 *   maxAge    — 7 days in seconds
 *   path      — available for all routes
 */
export const SESSION_COOKIE_NAME = "sash_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};
