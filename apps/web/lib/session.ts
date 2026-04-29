/**
 * lib/session.ts
 *
 * All logic for creating, reading, refreshing, and destroying user sessions
 * stored in Redis. This is the CORE of how Sash keeps users logged in.
 *
 * REDIS KEY FORMAT:
 *   session:<sessionId> → JSON { userId, projectId }
 *   TTL: 7 days (604800 seconds)
 *
 * EXPORTED FUNCTIONS:
 *   createSession(userId, projectId)  → creates a new session, returns sessionId
 *   getSession(sessionId)             → returns payload or null if missing/expired
 *   deleteSession(sessionId)          → removes session (logout)
 *   refreshSession(sessionId)         → resets TTL (sliding window keep-alive)
 */

import { redis } from "./redis";
import { randomBytes } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  projectId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_PREFIX = "session:";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * createSession
 *
 * Generates a cryptographically random sessionId, stores the session payload
 * in Redis with a 7-day TTL, and returns the sessionId.
 *
 * The sessionId is then set as an HTTP-only cookie on the client.
 */
export async function createSession(
  userId: string,
  projectId: string
): Promise<string> {
  const sessionId = randomBytes(32).toString("hex");
  const payload: SessionPayload = { userId, projectId };

  await redis.setex(sessionKey(sessionId), SESSION_TTL_SECONDS, JSON.stringify(payload));

  return sessionId;
}

/**
 * getSession
 *
 * Reads a session from Redis. Returns the payload if found, or null if the
 * session has expired or never existed. A null result should trigger a 401.
 */
export async function getSession(
  sessionId: string
): Promise<SessionPayload | null> {
  const raw = await redis.get<string>(sessionKey(sessionId));
  if (!raw) return null;

  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as SessionPayload);
  } catch {
    return null;
  }
}

/**
 * deleteSession
 *
 * Deletes a session from Redis. Called on logout.
 * The user is immediately invalidated — no waiting for TTL to expire.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(sessionKey(sessionId));
}

/**
 * refreshSession
 *
 * Resets the TTL of an existing session back to 7 days.
 * Called after a successful /me request to implement a sliding window —
 * active users stay logged in, inactive sessions naturally expire.
 */
export async function refreshSession(sessionId: string): Promise<void> {
  await redis.expire(sessionKey(sessionId), SESSION_TTL_SECONDS);
}

/**
 * invalidateAllUserSessions
 *
 * Deletes ALL active sessions for a given userId from Redis.
 * Called after a password reset to force re-login on all devices.
 *
 * STRATEGY: Upstash Redis supports SCAN — we scan all keys matching
 * "session:*", fetch each one, and delete those whose payload.userId matches.
 *
 * NOTE: This is O(n) over all sessions in Redis, but sessions are short-lived
 * (7 days) and most deployments won't have millions. If this becomes a
 * bottleneck, migrate to a reverse index: userId → Set<sessionId>.
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  let cursor = 0;

  do {
    // SCAN returns [nextCursor, keys[]]
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: `${SESSION_PREFIX}*`,
      count: 100,
    });

    // Upstash returns nextCursor as a string (e.g. "0").
    // We MUST cast it to a Number so the while (cursor !== 0) condition works!
    cursor = Number(nextCursor);

    if (keys.length === 0) continue;

    // Fetch all matched session payloads in parallel
    const values = await Promise.all(
      keys.map((k) => redis.get<string>(k))
    );

    const toDelete: string[] = [];

    for (let i = 0; i < keys.length; i++) {
      const raw = values[i];
      if (!raw) continue;

      try {
        const payload: SessionPayload =
          typeof raw === "string" ? JSON.parse(raw) : (raw as SessionPayload);

        if (payload.userId === userId) {
          toDelete.push(keys[i]);
        }
      } catch {
        // Malformed payload — skip
      }
    }

    if (toDelete.length > 0) {
      await Promise.all(toDelete.map((k) => redis.del(k)));
    }
  } while (cursor !== 0);
}
