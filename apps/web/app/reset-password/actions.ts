"use server";

import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import bcrypt from "bcryptjs";

export async function resetAdminPassword(email: string, code: string, newPassword: string) {
  if (!email || !code || !newPassword) {
    return { error: "Missing required fields." };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const cleanEmail = email.toLowerCase();

  // Verify OTP
  const status = await verifyOtp("reset", "sash-admin", cleanEmail, code);

  if (status === "expired") {
    return { error: "Reset code has expired. Please request a new one." };
  }
  if (status === "locked") {
    return { error: "Too many failed attempts. Please request a new reset code." };
  }
  if (status === "invalid") {
    return { error: "Invalid code. Please try again." };
  }

  // OTP verified! Hash new password and save
  const passwordHash = await bcrypt.hash(newPassword, 12);

  try {
    await prisma.projectOwner.update({
      where: { email: cleanEmail },
      data: { passwordHash },
    });
    return { success: true };
  } catch (err) {
    console.error("[resetAdminPassword] Error updating password:", err);
    return { error: "Failed to reset password. The account may not exist." };
  }
}
