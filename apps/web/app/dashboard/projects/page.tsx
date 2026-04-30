import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import CreateProjectButton from "./CreateProjectButton";

interface ProjectRecord {
  id: string;
  name: string;
  apiKey: string;
  webhookUrl: string | null;
  createdAt: Date;
  _count: { users: number };
}

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[color:var(--color-text-primary)]">Projects</h1>
          <p className="text-[14px] text-[color:var(--color-text-secondary)] mt-1">{projects.length} application{projects.length !== 1 ? "s" : ""} registered</p>
        </div>
        {/* Client component handles the modal */}
        <CreateProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-16 text-center shadow-sm">
          <div className="text-[40px] mb-4">📦</div>
          <p className="text-[15px] text-[color:var(--color-text-secondary)] mb-2 font-medium">
            No projects yet
          </p>
          <p className="text-[13px] text-[color:var(--color-text-muted)] mb-6">
            Create a project to get an API key and start integrating Sash.
          </p>
          <CreateProjectButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project: ProjectRecord) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group block h-full"
            >
              <div className="h-full bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-6 flex flex-col gap-4 group-hover:border-[color:var(--color-border-bright)] transition-colors shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-[40px] h-[40px] rounded-xl bg-[color:var(--color-brand-dim)] flex items-center justify-center text-[16px] font-bold text-[color:var(--color-brand-light)] shrink-0">
                      {project.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-[color:var(--color-text-primary)] text-[15px]">{project.name}</div>
                      <div className="text-[12px] text-[color:var(--color-text-muted)] mt-0.5">
                        {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-text-primary)] transition-colors" />
                </div>

                {/* API Key preview */}
                <div className="font-mono text-[11px] text-[color:var(--color-text-muted)] bg-[color:var(--color-bg-subtle)] px-2.5 py-1.5 rounded-lg border border-[color:var(--color-border-subtle)] overflow-hidden text-ellipsis whitespace-nowrap">
                  {project.apiKey.slice(0, 24)}…
                </div>

                {/* Footer */}
                <div className="flex items-center gap-1.5 mt-auto pt-2">
                  <Users size={13} className="text-[color:var(--color-text-muted)]" />
                  <span className="text-[12px] text-[color:var(--color-text-muted)]">
                    {project._count.users} user{project._count.users !== 1 ? "s" : ""}
                  </span>
                  {project.webhookUrl && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500">
                      Webhook ✓
                    </span>
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
