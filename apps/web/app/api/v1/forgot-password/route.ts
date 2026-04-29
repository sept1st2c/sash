/**
 * POST /api/v1/forgot-password
 *
 * Initiates a password reset by sending a 6-digit OTP to the user's email.
 *
 * SECURITY: Always returns 200, regardless of whether the email exists.
 * This prevents user enumeration attacks.
 *
 * REQUEST BODY:
 *   { "email": "user@example.com" }
 *
 * RESPONSE (200):
 *   { "message": "If an account with that email exists, a reset code has been sent." }
 */

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
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
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const { email } = body;
  if (!email || typeof email !== "string") {
    return jsonError("A valid email is required.", 422);
  }

  const genericResponse = jsonSuccess({
    message: "If an account with that email exists, a reset code has been sent.",
  });

  // ── Step 3: Look up user (silently exit if not found) ─────────────────────
  const user = await prisma.user.findUnique({
    where: { email_projectId: { email: email.toLowerCase(), projectId: project.id } },
    select: { id: true, isActive: true },
  });

  // Don't reveal whether account exists
  if (!user || !user.isActive) return genericResponse;

  // ── Step 4: Generate, store, and send OTP ─────────────────────────────────
  const code = generateOtp();
  await storeOtp("reset", project.id, email, code);

  try {
    await sendPasswordResetEmail(email.toLowerCase(), code);
  } catch (err) {
    console.error("[forgot-password] Email send failed:", err);
  }

  return genericResponse;
}
