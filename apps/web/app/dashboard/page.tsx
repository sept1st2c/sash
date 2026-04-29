/**
 * app/dashboard/page.tsx
 *
 * Dashboard home / Overview page.
 * Server component — fetches aggregate stats from the DB for the logged-in owner.
 *
 * DISPLAYS:
 *   - Total projects count
 *   - Total users across all projects
 *   - Quick link to create first project (if none exist)
 *   - Recent projects list
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderOpen, Users, ArrowRight, Plus } from "lucide-react";

export default async function DashboardOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Aggregate stats
  const [projectCount, projects] = await Promise.all([
    prisma.project.count({ where: { ownerId: session.user.id } }),
    prisma.project.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalUsers = projects.reduce((sum, p) => sum + p._count.users, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Welcome back, {session.user.email}</p>
        </div>
        <Link href="/dashboard/projects" id="overview-new-project" className="btn btn-primary">
          <Plus size={15} /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <FolderOpen size={18} color="var(--brand-light)" />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Projects</span>
          </div>
          <div className="stat-value">{projectCount}</div>
          <div className="stat-label">Active applications</div>
        </div>

        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Users size={18} color="var(--success)" />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Users</span>
          </div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Across all projects</div>
        </div>
      </div>

      {/* Recent projects */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Recent Projects</h2>
        <Link href="/dashboard/projects" style={{ fontSize: 13, color: "var(--brand-light)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <FolderOpen size={40} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>No projects yet. Create your first one.</p>
          <Link href="/dashboard/projects" id="overview-empty-new" className="btn btn-primary" style={{ display: "inline-flex" }}>
            <Plus size={15} /> Create Project
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              id={`overview-project-${project.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--brand-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--brand-light)",
                    flexShrink: 0,
                  }}>
                    {project.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{project.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {project._count.users} user{project._count.users !== 1 ? "s" : ""} · Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
