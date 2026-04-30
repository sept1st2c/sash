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
          <BookOpen size={15} className="text-[color:var(--color-brand-light)]" />
          <span className="text-[13px] font-semibold text-[color:var(--color-text-primary)]">Documentation</span>
        </div>

        <nav className="flex flex-col gap-5">
          {docNav.map((section) => (
            <div key={section.category}>
              <div className="flex items-center gap-1.5 px-1 mb-1.5">
                <section.icon size={11} className="text-[color:var(--color-text-muted)]" />
                <span className="text-[11px] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider">
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                        active
                          ? "bg-[color:var(--color-brand-dim)] text-[color:var(--color-brand-light)] font-medium"
                          : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)]"
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
