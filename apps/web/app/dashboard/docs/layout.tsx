"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Zap, BookOpen, Code2, Globe, Shield } from "lucide-react";

const docNav = [
  {
    category: "Getting Started",
    icon: Zap,
    links: [
      { href: "/dashboard/docs", label: "Introduction", exact: true },
      { href: "/dashboard/docs/quickstart", label: "Quick Start" },
    ],
  },
  {
    category: "React SDK",
    icon: Code2,
    links: [
      { href: "/dashboard/docs/sdk", label: "SashProvider & useSash()" },
    ],
  },
  {
    category: "API Reference",
    icon: Globe,
    links: [
      { href: "/dashboard/docs/api-reference", label: "All Endpoints" },
    ],
  },
  {
    category: "Security",
    icon: Shield,
    links: [
      { href: "/dashboard/docs/webhooks", label: "Webhooks" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-8 min-h-full">
      {/* Docs sidebar */}
      <aside className="w-[220px] shrink-0 sticky top-0 self-start pt-1">
        <div className="flex items-center gap-2 mb-6 px-1">
          <BookOpen size={15} style={{ color: "var(--wise-primary)" }} />
          <span className="text-[13px] font-semibold" style={{ color: "var(--wise-ink)" }}>Documentation</span>
        </div>

        <nav className="flex flex-col gap-5">
          {docNav.map((section) => (
            <div key={section.category}>
              <div className="flex items-center gap-1.5 px-1 mb-1.5">
                <section.icon size={11} style={{ color: "var(--wise-mute)" }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--wise-mute)" }}>
                  {section.category}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {section.links.map((link) => {
                  const active = link.exact ? pathname === link.href : pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--wise-radius-md)] text-[13px] transition-all ${
                        active
                          ? "bg-[rgba(159,232,112,0.12)] text-[color:var(--wise-primary)] font-medium"
                          : "text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)]"
                      }`}
                    >
                      {active && <ChevronRight size={11} />}
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 pb-16">
        {children}
      </main>
    </div>
  );
}
