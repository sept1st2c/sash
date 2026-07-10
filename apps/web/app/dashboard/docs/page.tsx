"use client";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRight, Zap, Code2, Globe, Shield } from "lucide-react";

const quickLinks = [
  {
    icon: Zap,
    title: "Quick Start",
    description: "Get your first user logged in within 5 minutes.",
    href: "/dashboard/docs/quickstart",
    color: "var(--wise-warning)",
  },
  {
    icon: Code2,
    title: "React SDK",
    description: "Full reference for SashProvider and useSash().",
    href: "/dashboard/docs/sdk",
    color: "var(--wise-primary)",
  },
  {
    icon: Globe,
    title: "API Reference",
    description: "All REST endpoints with request and response schemas.",
    href: "/dashboard/docs/api-reference",
    color: "var(--wise-accent-cyan)",
  },
  {
    icon: Shield,
    title: "Webhooks",
    description: "Receive real-time events and verify signatures.",
    href: "/dashboard/docs/webhooks",
    color: "var(--wise-negative)",
  },
];

const whatSashHandles = [
  "User signup and login with bcrypt-hashed passwords",
  "Redis-backed sessions with HTTP-only cookies",
  "Email verification via OTP (Resend-powered)",
  "Password reset with automatic session invalidation",
  "Rate limiting and brute-force protection",
  "Webhook events for every auth action",
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DocsIndexPage() {
  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 pb-8 border-b"
        style={{ borderColor: "var(--wise-border)" }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--wise-radius-pill)] mb-4"
          style={{ backgroundColor: "rgba(159,232,112,0.12)", border: "1px solid var(--wise-border)" }}
        >
          <Zap size={11} style={{ color: "var(--wise-primary)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--wise-primary)" }}>
            v0.1 · Phase 5
          </span>
        </div>
        <h1
          className="text-[30px] md:text-[34px] tracking-tight mb-3"
          style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
        >
          Sash Documentation
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--wise-body)" }}>
          Sash is an auth-as-a-service platform. Drop it into any React project
          with a single provider component and one API key.
        </p>
      </motion.div>

      {/* Quick links grid */}
      <h2
        className="text-[13px] font-semibold uppercase tracking-wider mb-4"
        style={{ color: "var(--wise-mute)" }}
      >
        Browse Sections
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
      >
        {quickLinks.map((item) => (
          <motion.div key={item.href} variants={rise}>
            <Link
              href={item.href}
              className="group flex flex-col gap-3 p-5 rounded-[var(--wise-radius-lg)] transition-all hover:-translate-y-[2px]"
              style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
            >
              <div
                className="w-9 h-9 rounded-[var(--wise-radius-md)] flex items-center justify-center"
                style={{ backgroundColor: "rgba(159,232,112,0.12)" }}
              >
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <div>
                <div className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: "var(--wise-ink)" }}>
                  {item.title}
                  <ArrowRight
                    size={13}
                    className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
                  />
                </div>
                <div className="text-[13px] mt-0.5" style={{ color: "var(--wise-body)" }}>
                  {item.description}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* What is Sash */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="rounded-[var(--wise-radius-lg)] p-6"
        style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
      >
        <h2
          className="text-[17px] mb-3"
          style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
        >
          What is Sash?
        </h2>
        <p className="max-w-xl text-[14px] leading-relaxed mb-4" style={{ color: "var(--wise-body)" }}>
          Sash manages authentication for your apps so you don&apos;t have to. Create a project in the
          dashboard, grab an API key, and install the SDK. Sash handles:
        </p>
        <ul className="space-y-2">
          {whatSashHandles.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px]" style={{ color: "var(--wise-body)" }}>
              <span
                className="mt-1 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[9px]"
                style={{ backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-primary)" }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
