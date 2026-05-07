/**
 * lib/validations.ts
 *
 * Centralised Zod schemas for all API route inputs.
 *
 * Password rules (moderate — not over-engineered):
 *   • 8 – 72 characters  (72 is bcrypt's hard limit)
 *   • At least 1 letter
 *   • At least 1 number
 *
 * Email rules:
 *   • Valid RFC-style format
 *   • Lowercase-normalised before validation
 *   • Disposable / throwaway domains are rejected
 */

import { z } from "zod";
import disposableDomains from "disposable-email-domains";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const disposableSet = new Set(disposableDomains as string[]);

function isDisposable(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? disposableSet.has(domain) : false;
}

// ─── Reusable field schemas ───────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("A valid email address is required.")
  .refine((email) => !isDisposable(email), {
    message: "Disposable email addresses are not allowed.",
  });

/**
 * Moderate password rules:
 *   - 8 to 72 characters
 *   - at least one letter
 *   - at least one number
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password cannot exceed 72 characters.")
  .refine((pw) => /[a-zA-Z]/.test(pw), {
    message: "Password must contain at least one letter.",
  })
  .refine((pw) => /[0-9]/.test(pw), {
    message: "Password must contain at least one number.",
  });

// ─── Route-level schemas ──────────────────────────────────────────────────────

/** POST /api/v1/signup */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** POST /api/v1/login */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

/** POST /api/v1/send-verification */
export const sendVerificationSchema = z.object({
  email: emailSchema,
});

/** POST /api/v1/verify-email */
export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits.")
    .regex(/^\d{6}$/, "Verification code must be numeric."),
});

/** POST /api/v1/forgot-password */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/** POST /api/v1/reset-password */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .length(6, "Reset code must be exactly 6 digits.")
    .regex(/^\d{6}$/, "Reset code must be numeric."),
  newPassword: passwordSchema,
});

// ─── Parse helper ─────────────────────────────────────────────────────────────

/**
 * Safely parses input against a Zod schema.
 * Returns { data } on success, or { errors } — a human-readable string array — on failure.
 */
export function safeParse<T>(
  schema: z.ZodType<T>,
  input: unknown
): { data: T; errors?: never } | { data?: never; errors: string[] } {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };
  const errors = result.error.issues.map((i) => i.message);
  return { errors };
}

