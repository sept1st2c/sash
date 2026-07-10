"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRight, Users, Check } from "lucide-react";

export interface ProjectCardData {
  id: string;
  name: string;
  apiKeyPreview: string;
  userCount: number;
  hasWebhook: boolean;
  createdLabel: string;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function ProjectsGrid({ projects }: { projects: ProjectCardData[] }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {projects.map((project) => (
        <motion.div key={project.id} variants={rise} className="h-full min-w-0">
          <Link href={`/dashboard/projects/${project.id}`} className="group block h-full">
            <div className="h-full flex flex-col gap-4 bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-6 group-hover:border-[color:var(--wise-primary)] transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-[40px] h-[40px] rounded-xl bg-[rgba(159,232,112,0.12)] flex items-center justify-center text-[16px] font-bold text-[color:var(--wise-primary)] shrink-0">
                    {project.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[color:var(--wise-ink)] text-[15px] truncate">{project.name}</div>
                    <div className="text-[12px] text-[color:var(--wise-mute)] mt-0.5">{project.createdLabel}</div>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-[color:var(--wise-mute)] group-hover:text-[color:var(--wise-primary)] group-hover:translate-x-0.5 transition-all"
                />
              </div>

              {/* API Key preview */}
              <div className="font-mono text-[11px] text-[color:var(--wise-code-text-muted)] bg-[color:var(--wise-canvas)] px-2.5 py-1.5 rounded-lg border border-[color:var(--wise-border)] overflow-hidden text-ellipsis whitespace-nowrap">
                {project.apiKeyPreview}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-1.5 mt-auto pt-2 min-w-0">
                <Users size={13} className="text-[color:var(--wise-mute)] shrink-0" />
                <span className="text-[12px] text-[color:var(--wise-mute)] truncate">
                  {project.userCount} user{project.userCount !== 1 ? "s" : ""}
                </span>
                {project.hasWebhook && (
                  <span className="ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[rgba(159,232,112,0.12)] text-[color:var(--wise-primary)]">
                    <Check size={11} strokeWidth={3} /> Webhook
                  </span>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
