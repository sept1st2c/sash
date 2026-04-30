import Link from "next/link";
import { ArrowRight, Zap, Code2, Globe, Shield } from "lucide-react";

const quickLinks = [
  {
    icon: Zap,
    title: "Quick Start",
    description: "Get your first user logged in within 5 minutes.",
    href: "/dashboard/docs/quickstart",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: Code2,
    title: "React SDK",
    description: "Full reference for SashProvider and useSash().",
    href: "/dashboard/docs/sdk",
    color: "text-[color:var(--color-brand-light)]",
    bg: "bg-[color:var(--color-brand-dim)]",
  },
  {
    icon: Globe,
    title: "API Reference",
    description: "All REST endpoints with request & response schemas.",
    href: "/dashboard/docs/api-reference",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Shield,
    title: "Webhooks",
    description: "Receive real-time events and verify signatures.",
    href: "/dashboard/docs/webhooks",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
];

export default function DocsIndexPage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10 pb-8 border-b border-[color:var(--color-border-subtle)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--color-brand-dim)] border border-[color:var(--color-brand)]/30 mb-4">
          <Zap size={11} className="text-[color:var(--color-brand-light)]" />
          <span className="text-[11px] font-semibold text-[color:var(--color-brand-light)] uppercase tracking-wider">v0.1 · Phase 5</span>
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[color:var(--color-text-primary)] mb-3">
          Sash Documentation
        </h1>
        <p className="text-[15px] text-[color:var(--color-text-secondary)] leading-relaxed max-w-xl">
          Sash is an auth-as-a-service platform. Drop it into any React project
          with a single Provider component and one API key.
        </p>
      </div>

      {/* Quick links grid */}
      <h2 className="text-[13px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-4">
        Browse Sections
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-3 p-5 rounded-[16px] bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] hover:border-[color:var(--color-border-bright)] hover:-translate-y-[2px] transition-all shadow-sm"
          >
            <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
              <item.icon size={16} className={item.color} />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[color:var(--color-text-primary)] flex items-center gap-1.5">
                {item.title}
                <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
              </div>
              <div className="text-[13px] text-[color:var(--color-text-secondary)] mt-0.5">
                {item.description}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* What is Sash */}
      <div className="rounded-[16px] bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] p-6 shadow-sm">
        <h2 className="text-[15px] font-bold text-[color:var(--color-text-primary)] mb-3">What is Sash?</h2>
        <p className="text-[14px] text-[color:var(--color-text-secondary)] leading-relaxed mb-4">
          Sash manages authentication for your apps so you don't have to. Create a project in the dashboard,
          grab an API key, and install the SDK. Sash handles:
        </p>
        <ul className="space-y-2">
          {[
            "User signup & login with bcrypt-hashed passwords",
            "Redis-backed sessions with HTTP-only cookies",
            "Email verification via OTP (Resend-powered)",
            "Password reset with automatic session invalidation",
            "Rate limiting & brute-force protection",
            "Webhook events for every auth action",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] text-[color:var(--color-text-secondary)]">
              <span className="mt-1 w-4 h-4 shrink-0 rounded-full bg-emerald-400/15 text-emerald-400 flex items-center justify-center text-[9px]">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
