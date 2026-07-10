import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import CreateProjectButton from "./CreateProjectButton";
import ProjectsGrid from "./ProjectsGrid";

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
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-[22px] font-[900] tracking-tight text-[color:var(--wise-ink)] [font-family:var(--font-wise-display)]">
            Projects
          </h1>
          <p className="text-[14px] text-[color:var(--wise-body)] mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} set up so far
          </p>
        </div>
        {/* Client component handles the modal */}
        <CreateProjectButton />
      </div>

      {projects.length === 0 ? (
        <div className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-16 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(159,232,112,0.12)] text-[color:var(--wise-primary)]">
            <FolderOpen size={20} />
          </div>
          <p className="text-[15px] text-[color:var(--wise-ink)] mb-2 font-semibold">
            No projects yet
          </p>
          <p className="text-[13px] text-[color:var(--wise-mute)] mb-6">
            Create one to get an API key and start wiring up Sash.
          </p>
          <CreateProjectButton />
        </div>
      ) : (
        <ProjectsGrid
          projects={projects.map((project: ProjectRecord) => ({
            id: project.id,
            name: project.name,
            apiKeyPreview: `${project.apiKey.slice(0, 24)}…`,
            userCount: project._count.users,
            hasWebhook: Boolean(project.webhookUrl),
            createdLabel: new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          }))}
        />
      )}
    </>
  );
}
