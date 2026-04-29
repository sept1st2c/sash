/**
 * app/dashboard/DashboardSidebar.tsx
 *
 * Client component — sidebar with navigation links and sign-out button.
 * Marks the active nav item based on the current pathname.
 *
 * PROPS:
 *   email — the logged-in ProjectOwner's email (for the footer avatar)
 */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FolderOpen, LogOut, Zap } from "lucide-react";

interface Props {
  email: string;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen, exact: false },
];

export default function DashboardSidebar({ email }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        S<span>ash</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label.toLowerCase()}`}
            className={`nav-item ${isActive(item.href, item.exact) ? "active" : ""}`}
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        {/* Owner info */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          marginBottom: 4,
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "var(--brand-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--brand-light)",
            flexShrink: 0,
          }}>
            {email[0]?.toUpperCase()}
          </div>
          <span style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {email}
          </span>
        </div>

        <button
          id="sidebar-signout"
          className="nav-item"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ color: "var(--danger)", width: "100%" }}
        >
          <LogOut size={16} strokeWidth={2} />
          Sign Out
        </button>
      </div>

      {/* Version tag */}
      <div style={{ marginTop: 12, padding: "0 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <Zap size={12} color="var(--brand)" />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Sash v0.1 · Phase 2</span>
      </div>
    </aside>
  );
}
