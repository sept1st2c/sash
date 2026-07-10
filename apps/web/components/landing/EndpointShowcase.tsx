"use client";

import { motion } from "motion/react";
import { Terminal, Lock, KeyRound } from "lucide-react";
import { endpointItems } from "./content";

const curlExample = `curl -X POST https://your-app.com/api/v1/signup \\
  -H "Authorization: Bearer sash_live_4f8a2e9d7c1b3a6f..." \\
  -H "Content-Type: application/json" \\
  -d '{"email":"jane@example.com","password":"Str0ngPassw0rd!"}'`;

const webhookSnippet = `import crypto from "crypto";

function verifySashWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}`;

export default function EndpointShowcase() {
  return (
    <section
      id="api"
      className="px-6 py-12 md:py-24"
      style={{ backgroundColor: "var(--wise-canvas-soft)", color: "var(--wise-ink)" }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="max-w-[720px]"
        >
          <span
            className="text-xs font-semibold tracking-[0.14em] uppercase"
            style={{ color: "var(--wise-positive-deep)" }}
          >
            Public API
          </span>
          <h2
            className="mt-3 text-3xl md:text-4xl"
            style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
          >
            Eight endpoints. One API key.
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--wise-body)" }}>
            Everything under <code>/api/v1/*</code> is scoped by the <code>sash_live_</code> API
            key that identifies your project, except <code>/logout</code> and{" "}
            <code>/me</code>, which run off the end user&apos;s own session instead.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* ── Endpoint console ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-[var(--wise-radius-xl)]"
            style={{ backgroundColor: "var(--wise-code-bg)" }}
          >
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Terminal size={14} style={{ color: "var(--wise-primary)" }} />
              <span className="font-mono text-xs" style={{ color: "var(--wise-code-text-muted)" }}>
                api/v1 route table
              </span>
            </div>
            <ul className="flex flex-col">
              {endpointItems.map((item) => (
                <li
                  key={item.path}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="w-12 shrink-0 rounded-[var(--wise-radius-sm)] px-2 py-1 text-center font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: item.method === "GET" ? "var(--wise-accent-cyan)" : "var(--wise-primary)",
                        color: "var(--wise-on-primary)",
                      }}
                    >
                      {item.method}
                    </span>
                    <span className="font-mono text-[13px]" style={{ color: "var(--wise-code-text-muted)" }}>
                      {item.path}
                    </span>
                  </div>
                  <div className="flex flex-1 items-start gap-2 sm:justify-between">
                    <p className="text-xs leading-relaxed" style={{ color: "var(--wise-mute)" }}>
                      {item.description}
                    </p>
                    <span
                      className="flex shrink-0 items-center gap-1 rounded-[var(--wise-radius-pill)] px-2 py-1 text-[10px] font-semibold whitespace-nowrap"
                      style={{ backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-primary)" }}
                    >
                      {item.auth === "API key" ? <KeyRound size={10} /> : <Lock size={10} />}
                      {item.auth}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── Curl + webhook verification ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <div
              className="rounded-[var(--wise-radius-xl)] p-5"
              style={{ backgroundColor: "var(--wise-canvas)" }}
            >
              <span className="text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--wise-mute)" }}>
                Try it
              </span>
              <pre className="mt-3 overflow-x-auto rounded-[var(--wise-radius-md)] p-4 font-mono text-[12px] leading-relaxed" style={{ backgroundColor: "var(--wise-code-bg)", color: "var(--wise-primary)" }}>
                {curlExample}
              </pre>
            </div>

            <div
              className="rounded-[var(--wise-radius-xl)] p-5"
              style={{ backgroundColor: "var(--wise-canvas)" }}
            >
              <span className="text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--wise-mute)" }}>
                Verify a webhook
              </span>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--wise-body)" }}>
                Every webhook POST carries an <code>X-Sash-Signature: sha256=…</code> header, an
                HMAC-SHA256 digest of the raw body signed with your{" "}
                <code>WEBHOOK_SIGNING_SECRET</code>.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-[var(--wise-radius-md)] p-4 font-mono text-[12px] leading-relaxed" style={{ backgroundColor: "var(--wise-code-bg)", color: "var(--wise-code-text-muted)" }}>
                {webhookSnippet}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
