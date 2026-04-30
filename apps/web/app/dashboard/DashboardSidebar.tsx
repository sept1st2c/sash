"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FolderOpen, LogOut, Zap, BookOpen } from "lucide-react";

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
    <aside className="w-[240px] shrink-0 bg-[color:var(--color-bg-surface)] border-r border-[color:var(--color-border-subtle)] flex flex-col p-6">
      {/* Logo */}
      <div className="text-[20px] font-bold tracking-tight text-[color:var(--color-text-primary)] px-2 pb-6 border-b border-[color:var(--color-border-subtle)] mb-4">
        S<span className="text-[color:var(--color-brand)]">ash</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                active 
                  ? "bg-[color:var(--color-brand-dim)] text-[color:var(--color-brand-light)]" 
                  : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-primary)]"
              }`}
            >
              <item.icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[color:var(--color-border-subtle)] pt-4">
        {/* Owner info */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-[30px] h-[30px] rounded-full bg-[color:var(--color-brand-dim)] flex items-center justify-center text-[13px] font-semibold text-[color:var(--color-brand-light)] shrink-0">
            {email[0]?.toUpperCase()}
          </div>
          <span className="text-[13px] text-[color:var(--color-text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap">
            {email}
          </span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-red-500 hover:bg-red-500/10 transition-all text-left"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign Out
        </button>
      </div>

      {/* Version tag */}
      <div className="mt-4 px-3 flex items-center gap-1.5">
        <Zap size={12} className="text-[color:var(--color-brand)]" />
        <span className="text-[11px] text-[color:var(--color-text-muted)]">Sash v0.1 · Phase 5</span>
      </div>
    </aside>
  );
}
