import { DocSection } from "../_components/DocSection";
import { CodeBlock } from "../_components/CodeBlock";

const events = [
  { name: "user.signup", description: "Fired when a new user successfully creates an account.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
  { name: "user.login", description: "Fired when a user successfully logs in.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
  { name: "user.verified", description: "Fired when a user verifies their email address via OTP.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
  { name: "user.password-reset", description: "Fired when a user successfully resets their password. All sessions are invalidated at this point.", payload: `{ "id": "user_123", "email": "user@example.com" }` },
];

export default function WebhooksPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[color:var(--color-border-subtle)]">
        <p className="text-[12px] font-semibold text-[color:var(--color-brand-light)] uppercase tracking-wider mb-2">Security</p>
        <h1 className="text-[24px] font-bold tracking-tight text-[color:var(--color-text-primary)] mb-2">Webhooks</h1>
        <p className="text-[14px] text-[color:var(--color-text-secondary)]">
          Sash fires HTTP POST events to your configured webhook URL whenever a key auth event occurs.
          Each request is signed with HMAC-SHA256 so you can verify it truly came from Sash.
        </p>
      </div>

      {/* Payload Shape */}
      <DocSection
        title="Webhook Payload Shape"
        description="Every webhook POST request has the same JSON envelope."
      >
        <CodeBlock
          language="json"
          code={`{
  "event": "user.signup",
  "projectId": "project_abc123",
  "timestamp": "2026-04-30T01:00:00.000Z",
  "data": {
    "id": "user_xyz",
    "email": "user@example.com"
  }
}`}
        />
      </DocSection>

      {/* Events */}
      <DocSection title="Event Types" description="Sash fires the following events:">
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.name} className="p-4 rounded-xl bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)]">
              <code className="block text-[13px] font-mono text-[color:var(--color-brand-light)] mb-1">{ev.name}</code>
              <p className="text-[13px] text-[color:var(--color-text-secondary)] mb-2">{ev.description}</p>
              <p className="text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-1">data payload</p>
              <CodeBlock language="json" code={ev.payload} />
            </div>
          ))}
        </div>
      </DocSection>

      {/* Signature */}
      <DocSection
        title="Verifying the Signature"
        description="Every webhook request includes an X-Sash-Signature header. This is an HMAC-SHA256 hex digest of the raw JSON body, signed with your WEBHOOK_SIGNING_SECRET. Always verify this before processing the event."
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
    case "user.verified":
      // e.g. unlock premium features
      break;
    case "user.password-reset":
      // e.g. alert user of reset via separate channel
      break;
  }

  return new Response("OK");
}`}
        />
      </DocSection>

      {/* Security notes */}
      <div className="rounded-[16px] bg-rose-400/5 border border-rose-400/20 p-6 space-y-2">
        <p className="text-[14px] font-semibold text-[color:var(--color-text-primary)]">🔐 Security Checklist</p>
        {[
          "Always verify the X-Sash-Signature before processing any event.",
          "Use crypto.timingSafeEqual (not ===) to prevent timing side-channel attacks.",
          "Store your WEBHOOK_SIGNING_SECRET in an environment variable — never hardcode it.",
          "Return HTTP 200 quickly (within 5s) — Sash will retry on failure.",
          "Treat webhooks as fire-and-forget — idempotently handle duplicate deliveries.",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2.5 text-[13px] text-[color:var(--color-text-secondary)]">
            <span className="text-rose-400 shrink-0 mt-0.5">•</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
