import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import DashboardStats from "./DashboardStats";
import RecentProjects from "./RecentProjects";

interface ProjectSummary {
  id: string;
  name: string;
  createdAt: Date;
  _count: { users: number };
}

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

  const totalUsers = projects.reduce((sum: number, p: ProjectSummary) => sum + p._count.users, 0);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-[22px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]">
            Overview
          </h1>
          <p className="text-[14px] text-[color:var(--wise-body)] mt-1">Welcome back, {session.user.email}</p>
        </div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] text-[color:var(--wise-on-primary)] text-[14px] font-semibold shrink-0 transition-colors hover:bg-[color:var(--wise-primary-active)]"
        >
          <Plus size={15} /> New project
        </Link>
      </div>

      {/* Stats */}
      <DashboardStats projectCount={projectCount} totalUsers={totalUsers} />

      {/* Recent projects */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--wise-ink)]">Recent projects</h2>
        <Link
          href="/dashboard/projects"
          className="text-[13px] text-[color:var(--wise-primary)] font-semibold hover:text-[color:var(--wise-primary-active)] hover:underline underline-offset-4 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <RecentProjects projects={projects} />
    </>
  );
}
