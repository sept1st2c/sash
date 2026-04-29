/**
 * app/dashboard/projects/page.tsx
 *
 * Projects list page — shows all projects with API keys and user counts.
 * "Create Project" modal is handled client-side so the page can be a Server Component.
 *
 * Server component — fetches projects for the logged-in owner directly from DB.
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import CreateProjectButton from "./CreateProjectButton";

export const metadata = { title: "Projects — Sash" };

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      apiKey: true,
      webhookUrl: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} application{projects.length !== 1 ? "s" : ""} registered</p>
        </div>
        {/* Client component handles the modal */}
        <CreateProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ padding: 64, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 8 }}>
            No projects yet
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
            Create a project to get an API key and start integrating Sash.
          </p>
          <CreateProjectButton />
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              id={`project-card-${project.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="card" style={{ padding: 24, height: "100%", cursor: "pointer", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--brand-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--brand-light)",
                    }}>
                      {project.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>{project.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>

                {/* API Key preview */}
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "var(--bg-subtle)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {project.apiKey.slice(0, 24)}…
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
                  <Users size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {project._count.users} user{project._count.users !== 1 ? "s" : ""}
                  </span>
                  {project.webhookUrl && (
                    <span className="badge badge-success" style={{ marginLeft: "auto" }}>Webhook ✓</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
