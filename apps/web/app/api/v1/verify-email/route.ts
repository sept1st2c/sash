/**
 * POST /api/v1/verify-email
 *
 * Verifies a user's email address using a 6-digit OTP.
 * On success, sets emailVerified=true on the User record.
 *
 * REQUEST BODY:
 *   { "email": "user@example.com", "code": "123456" }
 *
 * RESPONSE (200):
 *   { "message": "Email verified successfully." }
 *
 * ERRORS:
 *   400 — invalid / expired / locked OTP
 *   401 — bad API key
 *   404 — user not found
 *   409 — already verified
 */

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { dispatchWebhook } from "@/lib/webhook";
import { jsonError, jsonSuccess } from "@/lib/middleware-helpers";

export async function POST(req: NextRequest) {
  // ── Step 1: API key ───────────────────────────────────────────────────────
  let project;
  try {
    project = await validateApiKey(req);
  } catch {
    return jsonError("Invalid or missing API key.", 401);
  }

  // ── Step 2: Parse body ────────────────────────────────────────────────────
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const { email, code } = body;
  if (!email || typeof email !== "string") return jsonError("email is required.", 422);
  if (!code || typeof code !== "string") return jsonError("code is required.", 422);

  // ── Step 3: Look up user ──────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email_projectId: { email: email.toLowerCase(), projectId: project.id } },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) return jsonError("User not found.", 404);
  if (user.emailVerified) return jsonError("Email is already verified.", 409);

  // ── Step 4: Verify OTP ────────────────────────────────────────────────────
  const result = await verifyOtp("verify", project.id, email, code.trim());

  switch (result) {
    case "expired":
      return jsonError("The verification code has expired. Please request a new one.", 400);
    case "locked":
      return jsonError("Too many incorrect attempts. Please request a new code.", 400);
    case "invalid":
      return jsonError("Incorrect verification code.", 400);
  }

  // ── Step 5: Mark verified ─────────────────────────────────────────────────
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  // ── Step 6: Dispatch webhook (async, non-blocking) ────────────────────────
  if (project.webhookUrl) {
    dispatchWebhook(project, "user.email_verified", {
      id: user.id,
      email: user.email,
    }).catch((err) => console.error("[verify-email] Webhook dispatch failed:", err));
  }

  return jsonSuccess({ message: "Email verified successfully." });
}
