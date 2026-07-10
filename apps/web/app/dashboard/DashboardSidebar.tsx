"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FolderOpen, LogOut, Zap, BookOpen, ExternalLink } from "lucide-react";

interface Props {
  email: string;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen, exact: false },
  { href: "/dashboard/docs", label: "Docs", icon: BookOpen, exact: false },
];

export default function DashboardSidebar({ email }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-[240px] shrink-0 bg-[color:var(--wise-canvas-soft)] border-r border-[color:var(--wise-border)] flex flex-col p-6">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="text-[20px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)] px-2 pb-6 border-b border-[color:var(--wise-border)] mb-4 block"
      >
        S<span className="text-[color:var(--wise-primary)]">ash</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--wise-radius-md)] text-[14px] font-semibold transition-all ${
                active
                  ? "bg-[rgba(159,232,112,0.12)] text-[color:var(--wise-primary)]"
                  : "text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)]"
              }`}
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[color:var(--wise-border)] pt-4">
        {/* Owner info */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1 min-w-0">
          <div className="w-[30px] h-[30px] rounded-full bg-[rgba(159,232,112,0.12)] flex items-center justify-center text-[13px] font-semibold text-[color:var(--wise-primary)] shrink-0">
            {email[0]?.toUpperCase()}
          </div>
          <span className="text-[13px] text-[color:var(--wise-body)] overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            {email}
          </span>
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--wise-radius-md)] text-[14px] font-semibold text-[color:var(--wise-body)] hover:bg-[color:var(--wise-surface-alt)] hover:text-[color:var(--wise-ink)] transition-all"
        >
          <ExternalLink size={16} strokeWidth={2} />
          View public site
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--wise-radius-md)] text-[14px] font-semibold text-[color:var(--wise-negative)] hover:bg-[color:var(--wise-negative-bg)] transition-all text-left"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>

      {/* Version tag */}
      <div className="mt-4 px-3 flex items-center gap-1.5">
        <Zap size={12} className="text-[color:var(--wise-primary)]" />
        <span className="text-[11px] text-[color:var(--wise-mute)]">Sash v0.1 · Phase 5</span>
      </div>
    </aside>
  );
}
