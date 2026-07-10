"use client";
import { motion, type Variants } from "motion/react";
import { DocSection } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";

const events = [
  { name: "user.signup", description: "Fired when a new user successfully creates an account.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
  { name: "user.login", description: "Fired when a user successfully logs in.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
  { name: "user.email_verified", description: "Fired when a user verifies their email address via OTP.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
  { name: "user.password_reset", description: "Fired when a user successfully resets their password. All sessions are invalidated at this point.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
];

const securityChecklist = [
  "Always verify the X-Sash-Signature before processing any event.",
  "Use crypto.timingSafeEqual, not ===, to prevent timing side-channel attacks.",
  "Store your WEBHOOK_SIGNING_SECRET in an environment variable, never hardcode it.",
  "Sash waits up to 10 seconds for your endpoint to respond, then gives up. There's no retry yet, so a dropped delivery is gone for good.",
  "Treat webhooks as fire and forget on our end, and handle duplicate deliveries idempotently on yours.",
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function WebhooksPage() {
  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 pb-6 border-b"
        style={{ borderColor: "var(--wise-border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--wise-positive-deep)" }}>
          Security
        </p>
        <h1
          className="text-[26px] md:text-[30px] tracking-tight mb-2"
          style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
        >
          Webhooks
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
          Sash sends an HTTP POST to your configured webhook URL whenever a key auth event happens.
          Each request is signed with HMAC-SHA256, so you can verify it actually came from Sash.
        </p>
      </motion.div>

      {/* Payload Shape */}
      <DocSection
        title="Webhook Payload Shape"
        description="Every webhook POST request uses the same JSON envelope."
      >
        <CodeBlock
          language="json"
          code={`{
  "event": "user.signup",
  "projectId": "project_abc123",
  "timestamp": "2026-04-30T01:00:00.000Z",
  "user": {
    "id": "user_xyz",
    "email": "user@example.com"
  }
}`}
        />
      </DocSection>

      {/* Events */}
      <DocSection title="Event Types" description="Sash fires the following events:">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="space-y-3"
        >
          {events.map((ev) => (
            <motion.div
              key={ev.name}
              variants={rise}
              className="p-4 rounded-[var(--wise-radius-lg)]"
              style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
            >
              <code className="block text-[13px] font-mono mb-1" style={{ color: "var(--wise-primary)" }}>{ev.name}</code>
              <p className="text-[13px] mb-2" style={{ color: "var(--wise-body)" }}>{ev.description}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--wise-mute)" }}>data payload</p>
              <CodeBlock language="json" code={ev.payload} />
            </motion.div>
          ))}
        </motion.div>
      </DocSection>

      {/* Signature */}
      <DocSection
        title="Verifying the Signature"
        description="Every webhook request includes an X-Sash-Signature header: an HMAC-SHA256 hex digest of the raw JSON body, signed with your WEBHOOK_SIGNING_SECRET. Always verify this before processing the event."
      >
        <CodeBlock
          filename="Your backend (Node.js example)"
          language="typescript"
          code={`import crypto from "crypto";

export function verifySashWebhook(
  rawBody: string,        // the raw request body string
  signature: string,      // X-Sash-Signature header
  secret: string          // your WEBHOOK_SIGNING_SECRET
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}`}
        />
        <CodeBlock
          filename="Next.js Route Handler example"
          language="typescript"
          code={`import { verifySashWebhook } from "@/lib/sash-webhook";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-sash-signature") ?? "";

  if (!verifySashWebhook(rawBody, sig, process.env.WEBHOOK_SIGNING_SECRET!)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  switch (event.event) {
    case "user.signup":
      // e.g. send a welcome email
      break;
    case "user.email_verified":
      // e.g. unlock premium features
      break;
    case "user.password_reset":
      // e.g. alert the user via a separate channel
      break;
  }

  return new Response("OK");
}`}
        />
      </DocSection>

      {/* Security notes */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="rounded-[var(--wise-radius-lg)] p-6 space-y-2"
        style={{ backgroundColor: "rgba(255,122,122,0.05)", border: "1px solid var(--wise-negative-bg)" }}
      >
        <p className="text-[14px] font-semibold" style={{ color: "var(--wise-ink)" }}>Security checklist</p>
        {securityChecklist.map((item) => (
          <div key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--wise-body)" }}>
            <span className="shrink-0 mt-0.5" style={{ color: "var(--wise-negative)" }}>•</span>
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
