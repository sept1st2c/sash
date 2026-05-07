/**
 * POST /api/v1/reset-password
 *
 * Completes a password reset flow using a 6-digit OTP.
 *
 * REQUEST BODY:
 *   { "email": "user@example.com", "code": "123456", "newPassword": "..." }
 *
 * RESPONSE (200):
 *   { "message": "Password reset successfully." }
 *
 * ERRORS:
 *   400 — invalid/expired/locked OTP, weak password
 *   401 — bad API key
 *   404 — user not found
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { validateApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { invalidateAllUserSessions } from "@/lib/session";
import { dispatchWebhook } from "@/lib/webhook";
import { jsonError, jsonSuccess } from "@/lib/middleware-helpers";
import { resetPasswordSchema, safeParse } from "@/lib/validations";

export async function POST(req: NextRequest) {
  // ── Step 1: API key ───────────────────────────────────────────────────────
  let project;
  try {
    project = await validateApiKey(req);
  } catch {
    return jsonError("Invalid or missing API key.", 401);
  }

  // ── Step 2: Parse body ────────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const parsed = safeParse(resetPasswordSchema, rawBody);
  if (parsed.errors) {
    return jsonError(parsed.errors.join(" "), 422);
  }

  const { email, code, newPassword } = parsed.data;

  // ── Step 3: Look up user ──────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email_projectId: { email: email.toLowerCase(), projectId: project.id } },
    select: { id: true, email: true },
  });

  if (!user) return jsonError("No account found with that email.", 404);

  // ── Step 4: Verify OTP ────────────────────────────────────────────────────
  const result = await verifyOtp("reset", project.id, email, code.trim());

  switch (result) {
    case "expired":
      return jsonError("The reset code has expired. Please request a new one.", 400);
    case "locked":
      return jsonError("Too many incorrect attempts. Please request a new reset code.", 400);
    case "invalid":
      return jsonError("Incorrect reset code.", 400);
  }

  // ── Step 5: Hash new password ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // ── Step 6: Update the password ───────────────────────────────────────────
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // ── Step 7: Invalidate all existing sessions ──────────────────────────────
  await invalidateAllUserSessions(user.id);

  // ── Step 8: Dispatch webhook (async, non-blocking) ────────────────────────
  if (project.webhookUrl) {
    dispatchWebhook(project, "user.password_reset", {
      id: user.id,
      email: user.email,
    }).catch((err) => console.error("[reset-password] Webhook dispatch failed:", err));
  }

  return jsonSuccess({ message: "Password reset successfully." });
}
