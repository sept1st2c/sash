"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { FolderOpen, ArrowRight, Plus } from "lucide-react";

interface ProjectSummary {
  id: string;
  name: string;
  createdAt: Date;
  _count: { users: number };
}

interface Props {
  projects: ProjectSummary[];
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function RecentProjects({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-12 text-center">
        <FolderOpen size={40} className="text-[color:var(--wise-mute)] mx-auto mb-4" />
        <p className="text-[color:var(--wise-body)] mb-5">
          Nothing here yet. Create your first project to get an API key.
        </p>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--wise-radius-xl)] bg-[color:var(--wise-primary)] text-[color:var(--wise-on-primary)] text-[14px] font-semibold transition-colors hover:bg-[color:var(--wise-primary-active)]"
        >
          <Plus size={15} /> Create project
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
      {projects.map((project) => (
        <motion.div key={project.id} variants={rise} className="min-w-0">
          <Link href={`/dashboard/projects/${project.id}`} className="block group min-w-0">
            <div className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-5 flex items-center justify-between gap-4 group-hover:border-[color:var(--wise-primary-neutral)] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-[36px] h-[36px] rounded-[var(--wise-radius-md)] flex items-center justify-center text-[14px] font-bold shrink-0"
                  style={{ backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-primary)" }}
                >
                  {project.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[color:var(--wise-ink)] text-[14px] truncate">
                    {project.name}
                  </div>
                  <div className="text-[12px] text-[color:var(--wise-mute)] mt-0.5 truncate">
                    {project._count.users} user{project._count.users !== 1 ? "s" : ""} · Created{" "}
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-[color:var(--wise-mute)] group-hover:text-[color:var(--wise-ink)] transition-colors shrink-0"
              />
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
