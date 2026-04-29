/**
 * app/dashboard/projects/[id]/page.tsx
 *
 * Project detail page — the most important page in the dashboard.
 * Displays API key (with copy button), user count, webhook config,
 * and danger zone (delete project).
 *
 * Server component for data fetching; delegates interactive parts
 * to client components (ApiKeyDisplay, WebhookEditor, DeleteProject).
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import ApiKeyDisplay from "./ApiKeyDisplay";
import WebhookEditor from "./WebhookEditor";
import DeleteProject from "./DeleteProject";

type Params = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      apiKey: true,
      webhookUrl: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });

  if (!project) notFound();

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard/projects"
        id="back-to-projects"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 28 }}
      >
        <ArrowLeft size={14} /> All Projects
      </Link>

      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--brand-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--brand-light)",
            flexShrink: 0,
          }}>
            {project.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-subtitle">
              Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Users size={16} color="var(--success)" />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Users</span>
          </div>
          <div className="stat-value">{project._count.users}</div>
          <div className="stat-label">Registered via this project</div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* API Key */}
        <section className="card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>API Key</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Include this in the <code style={{ background: "var(--bg-subtle)", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "var(--brand-light)" }}>Authorization: Bearer &lt;key&gt;</code> header of every request.
          </p>
          <ApiKeyDisplay apiKey={project.apiKey} projectId={project.id} />
        </section>

        {/* Webhook */}
        <section className="card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Webhook URL</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Sash will POST signed events to this URL when users sign up or log in.
            Leave empty to disable webhooks.
          </p>
          <WebhookEditor projectId={project.id} currentUrl={project.webhookUrl ?? ""} />
        </section>

        {/* Integration snippet */}
        <section className="card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Quick Integration</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Test your API key with a quick curl command.
          </p>
          <pre className="mono" style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
{`curl -X POST ${process.env.NEXT_PUBLIC_SASH_BASE_URL}/api/v1/signup \\
  -H "Authorization: Bearer ${project.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"testpass123"}'`}
          </pre>
        </section>

        {/* Danger zone */}
        <section style={{ border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-lg)", padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--danger)" }}>Danger Zone</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Deleting this project is permanent and will remove all associated users and sessions. This cannot be undone.
          </p>
          <DeleteProject projectId={project.id} projectName={project.name} />
        </section>

      </div>
    </>
  );
}
