/**
 * lib/email.ts
 *
 * Resend-powered email sender for Sash transactional emails.
 *
 * WHY RESEND: Great DX, reliable deliverability, generous free tier,
 * and React-friendly HTML email support.
 *
 * EXPORTED FUNCTIONS:
 *   sendVerificationEmail(to, code)   → OTP email for email verification
 *   sendPasswordResetEmail(to, code)  → OTP email for password reset
 *
 * EMAIL DESIGN:
 *   - Plain but clean HTML (no external CSS frameworks — email clients are picky)
 *   - Brand color: #6366f1 (Sash indigo)
 *   - Large, clearly visible OTP code
 *   - Expiry reminder
 *   - Anti-phishing footer
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// The "from" address must be a verified domain in your Resend account.
// During development you can use onboarding@resend.dev (Resend's shared domain).
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "Sash <onboarding@resend.dev>";

// ─── HTML Template Helpers ────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#080a0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080a0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0e1117;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;max-width:480px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#312e81,#1e1b4b);padding:32px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;">
                S<span style="color:#818cf8;">ash</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;color:#f1f5f9;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                If you didn't request this email, you can safely ignore it.<br/>
                This email was sent by Sash — Auth as a Service.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpBlock(code: string): string {
  return `
  <div style="background:#141820;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:28px;text-align:center;margin:24px 0;">
    <div style="font-size:11px;font-weight:600;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;margin-bottom:12px;">
      Your verification code
    </div>
    <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#818cf8;font-family:monospace;">
      ${code}
    </div>
    <div style="font-size:12px;color:#475569;margin-top:12px;">
      Expires in 10 minutes
    </div>
  </div>`;
}

// ─── Email Senders ────────────────────────────────────────────────────────────

/**
 * sendVerificationEmail
 * Sends the OTP code for verifying a newly signed-up user's email address.
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">Verify your email</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Enter the code below in the app to verify your email address.
    </p>
    ${otpBlock(code)}
    <p style="margin:0;font-size:13px;color:#475569;">
      If you didn't create an account, no action is needed.
    </p>`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${code} is your Sash verification code`,
    html: baseTemplate("Verify your Sash email", body),
  });
}

/**
 * sendPasswordResetEmail
 * Sends the OTP code for resetting a user's password.
 */
export async function sendPasswordResetEmail(
  to: string,
  code: string
): Promise<void> {
  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#f1f5f9;">Reset your password</h2>
    <p style="margin:0 0 4px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Use this code to reset your password. It expires in 10 minutes.
    </p>
    ${otpBlock(code)}
    <p style="margin:0;font-size:13px;color:#475569;">
      If you didn't request a password reset, your account is safe — just ignore this email.
    </p>`;

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${code} is your Sash password reset code`,
    html: baseTemplate("Reset your Sash password", body),
  });
}
