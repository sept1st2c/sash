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
        className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--wise-body)] hover:text-[color:var(--wise-ink)] transition-colors mb-7"
      >
        <ArrowLeft size={14} /> All projects
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 min-w-0">
        <div className="w-[48px] h-[48px] rounded-xl bg-[rgba(159,232,112,0.12)] flex items-center justify-center text-[20px] font-bold text-[color:var(--wise-primary)] shrink-0">
          {project.name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="text-[22px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)] truncate">
            {project.name}
          </h1>
          <p className="text-[14px] text-[color:var(--wise-body)] mt-0.5">
            Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Users size={16} className="text-[color:var(--wise-primary)] shrink-0" />
              <span className="text-[13px] text-[color:var(--wise-body)] truncate">Total users</span>
            </div>
            <Link
              href={`/dashboard/projects/${project.id}/users`}
              className="shrink-0 text-[12px] font-medium text-[color:var(--wise-primary)] hover:underline underline-offset-4"
            >
              View directory &rarr;
            </Link>
          </div>
          <div className="text-[24px] font-bold text-[color:var(--wise-ink)] tracking-tight">{project._count.users}</div>
          <div className="text-[12px] text-[color:var(--wise-mute)] mt-1">Signed up through this project</div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">

        {/* API Key */}
        <section className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-7">
          <h2 className="text-[15px] font-semibold text-[color:var(--wise-ink)] mb-1.5">API key</h2>
          <p className="text-[13px] text-[color:var(--wise-body)] mb-4">
            Send this in the <code className="bg-[color:var(--wise-canvas)] px-1.5 py-0.5 rounded text-[12px] text-[color:var(--wise-primary)] font-mono">Authorization: Bearer &lt;key&gt;</code> header of every request.
          </p>
          <ApiKeyDisplay apiKey={project.apiKey} projectId={project.id} />
        </section>

        {/* Webhook */}
        <section className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-7">
          <h2 className="text-[15px] font-semibold text-[color:var(--wise-ink)] mb-1.5">Webhook URL</h2>
          <p className="text-[13px] text-[color:var(--wise-body)] mb-4">
            Sash posts signed events here when a user signs up or logs in. Leave it empty and webhooks stay off.
          </p>
          <WebhookEditor projectId={project.id} currentUrl={project.webhookUrl ?? ""} />
        </section>

        {/* Integration snippet */}
        <section className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-7">
          <h2 className="text-[15px] font-semibold text-[color:var(--wise-ink)] mb-1.5">Quick integration</h2>
          <p className="text-[13px] text-[color:var(--wise-body)] mb-4">
            Try your API key with this curl command.
          </p>
          <div className="overflow-hidden rounded-[var(--wise-radius-lg)] border border-[color:var(--wise-border)] bg-[color:var(--wise-code-bg)]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(255,255,255,0.08)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              <span className="ml-2 min-w-0 truncate font-mono text-[11px] text-[color:var(--wise-mute)]">
                terminal
              </span>
            </div>
            <pre className="wise-scroll overflow-x-auto overflow-y-hidden p-4 font-mono text-[12px] leading-relaxed whitespace-pre text-[color:var(--wise-primary)]">
{`curl -X POST ${process.env.NEXT_PUBLIC_SASH_BASE_URL}/api/v1/signup \\
  -H "Authorization: Bearer ${project.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"testpass123"}'`}
            </pre>
          </div>
        </section>

        {/* Danger zone */}
        <section className="border border-[rgba(255,122,122,0.3)] rounded-[var(--wise-radius-lg)] p-7 mt-4 bg-[color:var(--wise-negative-bg)]">
          <h2 className="text-[15px] font-semibold text-[color:var(--wise-negative)] mb-1.5">Danger zone</h2>
          <p className="text-[13px] text-[color:var(--wise-body)] mb-5">
            Deleting this project can&apos;t be undone. Every user and session tied to it goes with it.
          </p>
          <DeleteProject projectId={project.id} projectName={project.name} />
        </section>

      </div>
    </>
  );
}
