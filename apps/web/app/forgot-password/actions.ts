"use server";

import { prisma } from "@/lib/prisma";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export async function sendAdminResetCode(email: string) {
  if (!email || typeof email !== "string") {
    return { error: "A valid email is required." };
  }

  const owner = await prisma.projectOwner.findUnique({
    where: { email: email.toLowerCase() },
  });

  // For security, don't reveal if account doesn't exist to an attacker,
  // but for the developer dashboard flow it's okay to redirect them anyway.
  if (owner) {
    const code = generateOtp();
    // Using "sash-admin" as a hardcoded projectId for platform-level OTPs
    await storeOtp("reset", "sash-admin", email, code);

    try {
      await sendPasswordResetEmail(email.toLowerCase(), code);
    } catch (err) {
      console.error("[sendAdminResetCode] Failed to send email:", err);
      // In production you might want to return an error, but let's continue to the next screen.
    }
  }

  // Always redirect to prevent enumeration, or if we want to be nice we could just send them.
  redirect(`/reset-password?email=${encodeURIComponent(email.toLowerCase())}`);
}
