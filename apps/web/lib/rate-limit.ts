/**
 * lib/rate-limit.ts
 *
 * Brute-force protection for sensitive endpoints (/login, /signup) using
 * Redis's atomic INCR command.
 *
 * HOW IT WORKS:
 *   1. On each request, we INCR a counter key in Redis.
 *   2. On the FIRST increment (value === 1), we set the TTL (window).
 *   3. If the counter exceeds maxAttempts, the request is blocked (429).
 *   4. After the window expires, the key is auto-deleted — counter resets.
 *
 * WHY ATOMIC INCR:
 *   Unlike a GET → check → SET pattern, INCR is atomic in Redis.
 *   Two simultaneous requests can't both read "4" and both think they're
 *   under the limit. One will get 5, one will get 6 — both correctly counted.
 *
 * REDIS KEY FORMAT:
 *   rate_limit:<projectId>:<ip>
 *   TTL: windowSecs (e.g. 60 seconds)
 *
 * EXPORTED FUNCTIONS:
 *   rateLimit(key, maxAttempts, windowSecs)  → { allowed, remaining }
 *   buildRateLimitKey(projectId, ip)         → namespaced key string
 */

import { redis } from "./redis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds?: number;
}

// ─── Key Builder ──────────────────────────────────────────────────────────────

/**
 * buildRateLimitKey
 *
 * Namespaces the rate limit key by projectId so different tenants
 * don't share rate limit state against the same IP.
 */
export function buildRateLimitKey(projectId: string, ip: string): string {
  return `rate_limit:${projectId}:${ip}`;
}

// ─── Core Function ────────────────────────────────────────────────────────────

/**
 * rateLimit
 *
 * Increments a Redis counter and checks if the request should be allowed.
 *
 * @param key         - The Redis key to increment (use buildRateLimitKey)
 * @param maxAttempts - Max allowed requests within the window (e.g. 10)
 * @param windowSecs  - Time window in seconds (e.g. 60)
 * @returns           - { allowed: boolean, remaining: number }
 */
export async function rateLimit(
  key: string,
  maxAttempts: number,
  windowSecs: number
): Promise<RateLimitResult> {
  // INCR is atomic — returns the new value after incrementing
  const count = await redis.incr(key);

  // On the very first increment, set the expiry window
  if (count === 1) {
    await redis.expire(key, windowSecs);
  }

  const allowed = count <= maxAttempts;
  const remaining = Math.max(0, maxAttempts - count);

  return { allowed, remaining };
}
