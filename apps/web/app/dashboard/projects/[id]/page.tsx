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
        className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors mb-7"
      >
        <ArrowLeft size={14} /> All Projects
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-[48px] h-[48px] rounded-xl bg-[color:var(--color-brand-dim)] flex items-center justify-center text-[20px] font-bold text-[color:var(--color-brand-light)] shrink-0 shadow-sm">
          {project.name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[color:var(--color-text-primary)]">{project.name}</h1>
          <p className="text-[14px] text-[color:var(--color-text-secondary)] mt-0.5">
            Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-emerald-500" />
            <span className="text-[13px] text-[color:var(--color-text-secondary)]">Total Users</span>
          </div>
          <div className="text-[24px] font-bold text-[color:var(--color-text-primary)] tracking-tight">{project._count.users}</div>
          <div className="text-[12px] text-[color:var(--color-text-secondary)] mt-1">Registered via this project</div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">

        {/* API Key */}
        <section className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-7 shadow-sm">
          <h2 className="text-[15px] font-semibold mb-1.5">API Key</h2>
          <p className="text-[13px] text-[color:var(--color-text-secondary)] mb-4">
            Include this in the <code className="bg-[color:var(--color-bg-subtle)] px-1.5 py-0.5 rounded text-[12px] text-[color:var(--color-brand-light)] font-mono">Authorization: Bearer &lt;key&gt;</code> header of every request.
          </p>
          <ApiKeyDisplay apiKey={project.apiKey} projectId={project.id} />
        </section>

        {/* Webhook */}
        <section className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-7 shadow-sm">
          <h2 className="text-[15px] font-semibold mb-1.5">Webhook URL</h2>
          <p className="text-[13px] text-[color:var(--color-text-secondary)] mb-4">
            Sash will POST signed events to this URL when users sign up or log in.
            Leave empty to disable webhooks.
          </p>
          <WebhookEditor projectId={project.id} currentUrl={project.webhookUrl ?? ""} />
        </section>

        {/* Integration snippet */}
        <section className="bg-[color:var(--color-bg-elevated)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-7 shadow-sm">
          <h2 className="text-[15px] font-semibold mb-1.5">Quick Integration</h2>
          <p className="text-[13px] text-[color:var(--color-text-secondary)] mb-4">
            Test your API key with a quick curl command.
          </p>
          <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap bg-[color:var(--color-bg-subtle)] p-4 rounded-[12px] border border-[color:var(--color-border-subtle)] text-[color:var(--color-brand-light)]">
{`curl -X POST ${process.env.NEXT_PUBLIC_SASH_BASE_URL}/api/v1/signup \\
  -H "Authorization: Bearer ${project.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"testpass123"}'`}
          </pre>
        </section>

        {/* Danger zone */}
        <section className="border border-red-500/20 rounded-[16px] p-7 mt-4 bg-red-500/5">
          <h2 className="text-[15px] font-semibold mb-1.5 text-red-500">Danger Zone</h2>
          <p className="text-[13px] text-[color:var(--color-text-secondary)] mb-5">
            Deleting this project is permanent and will remove all associated users and sessions. This cannot be undone.
          </p>
          <DeleteProject projectId={project.id} projectName={project.name} />
        </section>

      </div>
    </>
  );
}
