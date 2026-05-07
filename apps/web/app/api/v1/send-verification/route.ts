/**
 * POST /api/v1/send-verification
 *
 * Sends an OTP to the user's email for email address verification.
 *
 * REQUEST BODY:
 *   { "email": "user@example.com" }
 *
 * RESPONSE (200):
 *   { "message": "Verification code sent." }
 */

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-key";
import { prisma } from "@/lib/prisma";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendVerificationEmail } from "@/lib/email";
import { jsonError, jsonSuccess } from "@/lib/middleware-helpers";
import { sendVerificationSchema, safeParse } from "@/lib/validations";

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

  const parsed = safeParse(sendVerificationSchema, rawBody);
  if (parsed.errors) {
    return jsonError(parsed.errors.join(" "), 422);
  }

  const { email } = parsed.data;

  // ── Step 3: Look up the user ──────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email_projectId: { email: email.toLowerCase(), projectId: project.id } },
    select: { id: true, emailVerified: true },
  });

  // Anti-enumeration: return 200 even if user doesn't exist or is already verified
  if (!user || user.emailVerified) {
    return jsonSuccess({ message: "Verification code sent." });
  }

  // ── Step 4: Generate, store, and send OTP ─────────────────────────────────
  const code = generateOtp();
  await storeOtp("verify", project.id, email, code);

  try {
    await sendVerificationEmail(email.toLowerCase(), code);
  } catch (err) {
    console.error("[send-verification] Email send failed:", err);
  }

  return jsonSuccess({ message: "Verification code sent." });
}
