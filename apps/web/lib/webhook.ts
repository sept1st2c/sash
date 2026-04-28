/**
 * lib/webhook.ts
 *
 * Fires HTTP POST events to the developer's backend when auth events happen.
 * This keeps the developer's own database in sync with Sash user data.
 *
 * SECURITY — HMAC SIGNING:
 *   Each webhook payload is signed with HMAC-SHA256 using WEBHOOK_SIGNING_SECRET.
 *   The signature is sent in the X-Sash-Signature header.
 *   Developers verify this on their side to confirm the request is from Sash.
 *
 * PAYLOAD FORMAT:
 *   {
 *     "event": "user.signup",
 *     "projectId": "...",
 *     "user": { "id": "...", "email": "..." },
 *     "timestamp": "2024-01-01T00:00:00Z"
 *   }
 *
 * EXPORTED FUNCTIONS:
 *   dispatchWebhook(project, event, payload)  → fires the webhook (no-ops if no URL)
 *   buildSignature(body, secret)              → returns HMAC-SHA256 signature string
 */

import { createHmac } from "crypto";
import type { Project } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WebhookEvent = "user.signup" | "user.login" | "user.logout";

export interface WebhookUser {
  id: string;
  email: string;
}

// ─── Signature Builder ────────────────────────────────────────────────────────

/**
 * buildSignature
 *
 * Creates an HMAC-SHA256 signature of the raw body string.
 * Format: "sha256=<hex digest>"
 *
 * Developers should verify:
 *   const expected = buildSignature(rawBody, process.env.WEBHOOK_SIGNING_SECRET)
 *   if (expected !== req.headers['x-sash-signature']) return res.status(401).end()
 */
export function buildSignature(body: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(body, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

/**
 * dispatchWebhook
 *
 * Fires a signed HTTP POST to the project's webhookUrl.
 * 
 * IMPORTANT: This is called WITHOUT await in route handlers — it's a
 * best-effort fire-and-forget. A webhook failure should NOT block the
 * auth response. (Retry logic is Phase 2+ scope.)
 *
 * Silently no-ops if project.webhookUrl is null/empty.
 */
export async function dispatchWebhook(
  project: Project,
  event: WebhookEvent,
  user: WebhookUser
): Promise<void> {
  if (!project.webhookUrl) return;

  const payload = {
    event,
    projectId: project.id,
    user,
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  const secret = process.env.WEBHOOK_SIGNING_SECRET ?? "";
  const signature = buildSignature(body, secret);

  try {
    await fetch(project.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sash-Signature": signature,
        "User-Agent": "Sash-Webhook/1.0",
      },
      body,
      // 10 second timeout — don't let a slow webhook block anything
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Swallow errors — webhook failures are logged but don't affect auth flow
    console.error(`[Sash] Webhook delivery failed for project ${project.id} (event: ${event})`);
  }
}
