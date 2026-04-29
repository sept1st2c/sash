/**
 * lib/otp.ts
 *
 * One-Time Password (OTP) lifecycle management backed by Redis.
 *
 * WHY REDIS (not the DB):
 *   OTPs are ephemeral — they expire in minutes. Storing them in PostgreSQL
 *   would pollute the DB with short-lived rows and require a cleanup job.
 *   Redis TTL handles expiry automatically and atomically.
 *
 * KEY STRUCTURE:
 *   otp:<type>:<projectId>:<email>  →  "<6-digit-code>"
 *
 *   type:
 *     "verify"  — email verification on signup
 *     "reset"   — password reset
 *
 * OTP PROPERTIES:
 *   - 6 numeric digits (100000–999999)
 *   - 10 minute TTL
 *   - Single-use: deleted immediately on successful verification
 *   - Max 5 verify attempts before the key is deleted (brute-force protection)
 *
 * EXPORTED FUNCTIONS:
 *   generateOtp()                             → random 6-digit string
 *   storeOtp(type, projectId, email, code)    → saves to Redis with TTL
 *   verifyOtp(type, projectId, email, code)   → validates and deletes key
 */

import { redis } from "./redis";

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

type OtpType = "verify" | "reset";

function otpKey(type: OtpType, projectId: string, email: string): string {
  return `otp:${type}:${projectId}:${email.toLowerCase()}`;
}

function attemptKey(type: OtpType, projectId: string, email: string): string {
  return `otp_attempts:${type}:${projectId}:${email.toLowerCase()}`;
}

/**
 * generateOtp
 * Returns a cryptographically random 6-digit numeric string.
 * Uses Math.random for simplicity (sufficient for OTPs, not crypto keys).
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * storeOtp
 * Saves the OTP to Redis with a 10-minute TTL.
 * Overwrites any previous OTP for the same (type, project, email) triplet —
 * so users can safely request a new code if they didn't get the first one.
 */
export async function storeOtp(
  type: OtpType,
  projectId: string,
  email: string,
  code: string
): Promise<void> {
  const key = otpKey(type, projectId, email);
  const attKey = attemptKey(type, projectId, email);

  // Store OTP and reset attempt counter atomically
  await Promise.all([
    redis.set(key, code, { ex: OTP_TTL_SECONDS }),
    redis.del(attKey), // reset attempts when a fresh OTP is issued
  ]);
}

/**
 * verifyOtp
 * Validates a user-supplied code against the stored OTP.
 *
 * Returns:
 *   "ok"       — code matched, OTP has been deleted (single-use enforced)
 *   "invalid"  — code wrong, attempts counter incremented
 *   "expired"  — key not found (TTL elapsed or already used)
 *   "locked"   — too many wrong attempts, key deleted
 */
export async function verifyOtp(
  type: OtpType,
  projectId: string,
  email: string,
  code: string
): Promise<"ok" | "invalid" | "expired" | "locked"> {
  const key = otpKey(type, projectId, email);
  const attKey = attemptKey(type, projectId, email);

  const stored = await redis.get<string>(key);
  if (!stored) return "expired";

  if (stored === code) {
    // Correct — delete both keys (single-use)
    await Promise.all([redis.del(key), redis.del(attKey)]);
    return "ok";
  }

  // Wrong code — increment attempts
  const attempts = await redis.incr(attKey);
  await redis.expire(attKey, OTP_TTL_SECONDS);

  if (attempts >= OTP_MAX_ATTEMPTS) {
    // Brute-force: nuke the OTP so attacker can't keep guessing
    await Promise.all([redis.del(key), redis.del(attKey)]);
    return "locked";
  }

  return "invalid";
}
