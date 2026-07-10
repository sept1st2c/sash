"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  ShieldCheck,
  Gauge,
  FileCheck2,
  Database,
  SendHorizonal,
  Webhook,
  KeyRound,
  Users,
  Building2,
  LayoutDashboard,
  Code2,
  Lock,
  Timer,
  ArrowDown,
  Cookie,
} from "lucide-react";
import { architectureCopy } from "./content";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const grow: Variants = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

interface PipelineStage {
  icon: typeof ShieldCheck;
  label: string;
  detail: string;
}

const pipelineStages: PipelineStage[] = [
  { icon: ShieldCheck, label: "validateApiKey", detail: "Bearer sash_live_… → Project" },
  { icon: Gauge, label: "rateLimit", detail: "10 attempts / 60s on signup + login" },
  { icon: FileCheck2, label: "Zod safeParse", detail: "req.json() validated against a schema" },
  { icon: Database, label: "Prisma", detail: "project-scoped read/write" },
  { icon: SendHorizonal, label: "jsonSuccess / jsonError", detail: "consistent response shape" },
];

const redisRows = architectureCopy.redisNamespaces;

function SectionBackground() {
  const reduceMotion = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--wise-border) 1px, transparent 1px), linear-gradient(90deg, var(--wise-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 55% 50% at 50% 0%, black 15%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 55% 50% at 50% 0%, black 15%, transparent 75%)",
          opacity: 0.6,
        }}
      />
      <motion.div
        className="absolute top-[-120px] left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(159,232,112,0.14) 0%, rgba(159,232,112,0) 70%)" }}
        animate={reduceMotion ? undefined : { opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function FlowPulse({ delay = 0 }: { delay?: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <motion.span
      aria-hidden
      className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
      style={{ background: "var(--wise-primary)", boxShadow: "0 0 8px 2px rgba(159,232,112,0.6)" }}
      initial={{ top: "0%", opacity: 0 }}
      animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, delay, ease: "easeInOut" }}
    />
  );
}

export default function ArchitectureDiagram() {
  return (
    <section
      id="architecture"
      className="relative overflow-hidden px-6 py-12 md:py-24"
      style={{ backgroundColor: "var(--wise-canvas)", color: "var(--wise-ink)" }}
    >
      <SectionBackground />
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-16 md:gap-20">
        {/* ── Intro ─────────────────────────────────────────────────────── */}
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
            Architecture
          </span>
          <h2
            className="mt-3 text-3xl md:text-4xl"
            style={{
              fontFamily: "var(--font-wise-display)",
              fontWeight: 900,
              color: "var(--wise-ink)",
            }}
          >
            One system, two ways in, no shared tables
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--wise-body)" }}>
            A developer signs into the Sash dashboard through NextAuth. Their app&apos;s end users
            sign into <em>that</em> app through the public API, a completely separate session
            system. Both paths land on the same Postgres database, but only end-user traffic
            touches Redis, and every row it writes is scoped to a single project.
          </p>
        </motion.div>

        {/* ── Diagram ───────────────────────────────────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-col"
        >
          {/* Band 1 — two entry points */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            <motion.div variants={rise}>
              <EntryCard
                icon={LayoutDashboard}
                eyebrow="System 1 · Dashboard"
                title="ProjectOwner login"
                subtitle="NextAuth Credentials provider, lib/auth.ts"
              />
            </motion.div>
            <motion.div variants={rise}>
              <EntryCard
                icon={Code2}
                eyebrow="System 2 · Public API"
                title="End-user auth"
                subtitle="/api/v1/*, called from @septic/sdk"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-10">
            <Connector pulseDelay={0} />
            <div className="hidden md:block">
              <Connector pulseDelay={0.4} />
            </div>
          </div>

          {/* Band 2 — how each path is handled */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            <motion.div variants={rise} className="flex flex-col gap-3">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-5 rounded-[var(--wise-radius-xl)] p-6"
                style={{
                  backgroundColor: "var(--wise-canvas-soft)",
                  border: "1px solid var(--wise-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <IconChip icon={Lock} />
                  <span className="font-mono text-[13px] font-semibold">bcrypt.compare()</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--wise-body)" }}>
                  <code>authorize()</code> looks up the <code>ProjectOwner</code> by email and
                  checks the password hash. No API key, no Redis. NextAuth signs a JWT session
                  cookie and the request never touches <code>/api/v1/*</code>.
                </p>

                <div
                  className="mt-auto flex items-center justify-center gap-3 rounded-[var(--wise-radius-lg)] p-5"
                  style={{ backgroundColor: "var(--wise-code-bg)" }}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <IconChip icon={KeyRound} size="sm" />
                    <span className="font-mono text-[10px]" style={{ color: "var(--wise-code-text-muted)" }}>
                      ProjectOwner
                    </span>
                  </div>
                  <div className="h-px w-8 shrink-0" style={{ backgroundColor: "var(--wise-border)" }} />
                  <div className="flex flex-col items-center gap-1.5">
                    <IconChip icon={Lock} size="sm" />
                    <span className="font-mono text-[10px]" style={{ color: "var(--wise-code-text-muted)" }}>
                      bcrypt hash
                    </span>
                  </div>
                  <div className="h-px w-8 shrink-0" style={{ backgroundColor: "var(--wise-border)" }} />
                  <div className="flex flex-col items-center gap-1.5">
                    <IconChip icon={Cookie} size="sm" />
                    <span className="font-mono text-[10px]" style={{ color: "var(--wise-code-text-muted)" }}>
                      JWT cookie
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={rise} className="flex flex-col gap-3">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-4 rounded-[var(--wise-radius-xl)] p-6"
                style={{
                  backgroundColor: "var(--wise-canvas-soft)",
                  border: "1px solid var(--wise-border)",
                }}
              >
                <p className="text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--wise-mute)" }}>
                  Every /api/v1/* request, same order
                </p>
                <div className="flex flex-col gap-2">
                  {pipelineStages.map((stage, i) => (
                    <div key={stage.label} className="flex items-center gap-3">
                      <IconChip icon={stage.icon} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-[12.5px] font-semibold">{stage.label}</span>
                        <span className="ml-2 text-[11px]" style={{ color: "var(--wise-mute)" }}>
                          {stage.detail}
                        </span>
                      </div>
                      {i < pipelineStages.length - 1 && (
                        <div
                          className="h-4 w-px shrink-0"
                          style={{ backgroundColor: "var(--wise-border)" }}
                          aria-hidden
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className="mx-3 h-6 border-l-2 border-dashed"
                  style={{ borderColor: "var(--wise-mute)" }}
                  aria-hidden
                />
                <div
                  className="flex items-center gap-3 rounded-[var(--wise-radius-lg)] p-3"
                  style={{ border: "1px dashed var(--wise-border)" }}
                >
                  <IconChip icon={Webhook} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[12.5px] font-semibold">dispatchWebhook()</span>
                    <p className="text-[11px] leading-snug" style={{ color: "var(--wise-mute)" }}>
                      Branches off, never awaited. A dead endpoint, 10s timeout, can&apos;t slow
                      your users down.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-10">
            <Connector pulseDelay={0.3} />
            <div className="hidden md:block">
              <Connector pulseDelay={0.6} />
            </div>
          </div>

          {/* Band 3 — data layer */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            {/* Postgres — durable */}
            <motion.div variants={rise} className="flex flex-col gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5 rounded-[var(--wise-radius-xl)] p-6"
                style={{
                  backgroundColor: "var(--wise-canvas-soft)",
                  border: "1px solid var(--wise-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <IconChip icon={Database} />
                  <div>
                    <p className="text-sm font-semibold">Postgres, via Prisma</p>
                    <p className="text-[11px]" style={{ color: "var(--wise-mute)" }}>
                      Durable data: ProjectOwner, Project, User
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <TreeNode icon={KeyRound} eyebrow="ProjectOwner" title="owner@acme.dev" />
                  <div className="h-6 w-px" style={{ backgroundColor: "var(--wise-border)" }} />
                  <div className="grid w-full grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-4">
                      <TreeNode icon={Building2} eyebrow="Project" title="Acme Project" compact />
                      <div className="h-4 w-px" style={{ backgroundColor: "var(--wise-border)" }} />
                      <UserRow email="jane@example.com" verified isActive />
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <TreeNode icon={Building2} eyebrow="Project" title="Beta Project" compact />
                      <div className="h-4 w-px" style={{ backgroundColor: "var(--wise-border)" }} />
                      <UserRow email="jane@example.com" verified={false} isActive={false} />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[var(--wise-radius-lg)] p-4"
                  style={{ backgroundColor: "var(--wise-code-bg)" }}
                >
                  <p className="font-mono text-[13px]" style={{ color: "var(--wise-primary)" }}>
                    @@unique([email, projectId])
                  </p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--wise-code-text-muted)" }}>
                    The multi-tenancy keystone, straight from <code>prisma/schema.prisma</code>.
                    Two rows, same email, zero relationship. Every query is scoped by{" "}
                    <code>projectId</code>.
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Redis — ephemeral */}
            <motion.div variants={rise} className="flex flex-col gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-5 rounded-[var(--wise-radius-xl)] p-6"
                style={{
                  backgroundColor: "var(--wise-canvas-soft)",
                  border: "1px solid var(--wise-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <IconChip icon={Timer} />
                  <div>
                    <p className="text-sm font-semibold">Redis, TTL-driven</p>
                    <p className="text-[11px]" style={{ color: "var(--wise-mute)" }}>
                      Ephemeral state: sessions, OTPs, rate limits
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[var(--wise-radius-lg)]" style={{ border: "1px solid var(--wise-border)" }}>
                  <table className="w-full min-w-[420px] border-collapse text-left">
                    <thead>
                      <tr style={{ backgroundColor: "var(--wise-surface-alt)" }}>
                        <th className="px-4 py-2.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
                          Key pattern
                        </th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
                          TTL
                        </th>
                        <th className="px-4 py-2.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {redisRows.map((row) => (
                        <tr key={row.pattern} style={{ borderTop: "1px solid var(--wise-border)" }}>
                          <td className="px-4 py-3 font-mono text-xs">{row.pattern}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <span
                              className="rounded-[var(--wise-radius-pill)] px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor: "rgba(159,232,112,0.12)",
                                color: "var(--wise-primary)",
                              }}
                            >
                              {row.ttl}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs leading-snug" style={{ color: "var(--wise-body)" }}>
                            {row.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] leading-relaxed" style={{ color: "var(--wise-mute)" }}>
                  Bulk invalidation (e.g. after a password reset) walks these keys with Redis{" "}
                  <code>SCAN</code>, never <code>KEYS</code>. Upstash blocks <code>KEYS</code>{" "}
                  outright in production.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Connector({ pulseDelay = 0 }: { pulseDelay?: number }) {
  return (
    <div className="flex justify-center py-2">
      <div className="relative h-8 w-px">
        <motion.div
          variants={grow}
          className="h-8 w-px origin-top"
          style={{ backgroundColor: "var(--wise-border)" }}
        />
        <FlowPulse delay={pulseDelay} />
      </div>
      <motion.div variants={rise} className="-mt-2 ml-[1px]">
        <ArrowDown size={13} strokeWidth={2.5} style={{ color: "var(--wise-mute)" }} />
      </motion.div>
    </div>
  );
}

function IconChip({
  icon: Icon,
  size = "md",
}: {
  icon: typeof ShieldCheck;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-[var(--wise-radius-sm)]`}
      style={{
        backgroundColor: "var(--wise-primary)",
        color: "var(--wise-on-primary)",
        boxShadow: "0 0 16px 1px rgba(159,232,112,0.35)",
      }}
    >
      <Icon size={size === "sm" ? 14 : 17} strokeWidth={2.25} />
    </div>
  );
}

function EntryCard({
  icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon: typeof ShieldCheck;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="flex h-full items-start gap-3 rounded-[var(--wise-radius-xl)] p-5"
      style={{
        backgroundColor: "var(--wise-surface-alt)",
        border: "1px solid var(--wise-border)",
      }}
    >
      <IconChip icon={icon} />
      <div>
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--wise-mute)" }}>
          {eyebrow}
        </span>
        <p className="text-sm font-semibold" style={{ color: "var(--wise-ink)" }}>
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--wise-body)" }}>
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function TreeNode({
  icon: Icon,
  eyebrow,
  title,
  compact,
}: {
  icon: typeof ShieldCheck;
  eyebrow: string;
  title: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex w-full ${compact ? "max-w-[220px]" : "max-w-[280px]"} items-center gap-3 rounded-[var(--wise-radius-lg)] p-3`}
      style={{
        backgroundColor: "var(--wise-surface-alt)",
        border: "1px solid var(--wise-border)",
      }}
    >
      <IconChip icon={Icon} size="sm" />
      <div className="min-w-0">
        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--wise-mute)" }}>
          {eyebrow}
        </span>
        <p className="truncate text-[13px] font-semibold" style={{ color: "var(--wise-ink)" }}>
          {title}
        </p>
      </div>
    </div>
  );
}

function UserRow({
  email,
  verified,
  isActive,
}: {
  email: string;
  verified: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className="flex w-full max-w-[220px] flex-col gap-2 rounded-[var(--wise-radius-lg)] p-3"
      style={{ backgroundColor: "var(--wise-canvas)", border: "1px solid var(--wise-border)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--wise-surface-alt)" }}
        >
          <Users size={12} strokeWidth={2.25} />
        </div>
        <p className="min-w-0 truncate font-mono text-[11px] font-semibold" style={{ color: "var(--wise-ink)" }}>
          {email}
        </p>
      </div>
      <div className="flex gap-1.5">
        <StatusPill positive={verified} onLabel="verified" offLabel="unverified" offVariant="muted" />
        <StatusPill positive={isActive} onLabel="active" offLabel="suspended" offVariant="negative" />
      </div>
    </div>
  );
}

function StatusPill({
  positive,
  onLabel,
  offLabel,
  offVariant,
}: {
  positive: boolean;
  onLabel: string;
  offLabel: string;
  offVariant: "muted" | "negative";
}) {
  const offStyle =
    offVariant === "negative"
      ? { backgroundColor: "var(--wise-negative-bg)", color: "var(--wise-negative)" }
      : { backgroundColor: "var(--wise-surface-alt)", color: "var(--wise-mute)" };
  const style = positive
    ? { backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-primary)" }
    : offStyle;
  return (
    <span
      className="rounded-[var(--wise-radius-pill)] px-2 py-0.5 text-[9.5px] font-semibold"
      style={style}
    >
      {positive ? onLabel : offLabel}
    </span>
  );
}
