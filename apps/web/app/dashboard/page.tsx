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

  const totalUsers = projects.reduce((sum: number, p: any) => sum + p._count.users, 0);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[color:var(--color-text-primary)]">Overview</h1>
          <p className="text-[14px] text-[color:var(--color-text-secondary)] mt-1">Welcome back, {session.user.email}</p>
        </div>
        <Link href="/dashboard/projects" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-[color:var(--color-brand-light)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-[1px] transition-all">
          <Plus size={15} /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <FolderOpen size={18} className="text-[color:var(--color-brand-light)]" />
            <span className="text-[13px] text-[color:var(--color-text-secondary)]">Projects</span>
          </div>
          <div className="text-[28px] font-bold text-[color:var(--color-text-primary)] tracking-tight">{projectCount}</div>
          <div className="text-[13px] text-[color:var(--color-text-secondary)] mt-1">Active applications</div>
        </div>

        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <Users size={18} className="text-emerald-500" />
            <span className="text-[13px] text-[color:var(--color-text-secondary)]">Total Users</span>
          </div>
          <div className="text-[28px] font-bold text-[color:var(--color-text-primary)] tracking-tight">{totalUsers}</div>
          <div className="text-[13px] text-[color:var(--color-text-secondary)] mt-1">Across all projects</div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--color-text-primary)]">Recent Projects</h2>
        <Link href="/dashboard/projects" className="text-[13px] text-[color:var(--color-brand-light)] font-medium hover:underline decoration-brand/30 underline-offset-4 flex items-center gap-1">
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-12 text-center shadow-sm">
          <FolderOpen size={40} className="text-[color:var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[color:var(--color-text-secondary)] mb-5">No projects yet. Create your first one.</p>
          <Link href="/dashboard/projects" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[color:var(--color-brand)] text-white rounded-xl text-[14px] font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:bg-[color:var(--color-brand-light)] hover:-translate-y-[1px] transition-all">
            <Plus size={15} /> Create Project
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block group"
            >
              <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-5 flex items-center justify-between group-hover:border-[color:var(--color-border-bright)] transition-colors shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-[36px] h-[36px] rounded-xl bg-[color:var(--color-brand-dim)] flex items-center justify-center text-[14px] font-bold text-[color:var(--color-brand-light)] shrink-0">
                    {project.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-[color:var(--color-text-primary)] text-[14px]">{project.name}</div>
                    <div className="text-[12px] text-[color:var(--color-text-muted)] mt-0.5">
                      {project._count.users} user{project._count.users !== 1 ? "s" : ""} · Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-text-primary)] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
