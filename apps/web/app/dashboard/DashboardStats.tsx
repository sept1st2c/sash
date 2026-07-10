"use client";

import { motion, type Variants } from "motion/react";
import { FolderOpen, Users } from "lucide-react";

interface Props {
  projectCount: number;
  totalUsers: number;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DashboardStats({ projectCount, totalUsers }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
    >
      <motion.div
        variants={rise}
        className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-6"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <FolderOpen size={18} className="text-[color:var(--wise-primary)]" />
          <span className="text-[13px] text-[color:var(--wise-body)]">Projects</span>
        </div>
        <div className="text-[28px] font-bold text-[color:var(--wise-ink)] tracking-tight">{projectCount}</div>
        <div className="text-[13px] text-[color:var(--wise-mute)] mt-1">Projects you own</div>
      </motion.div>

      <motion.div
        variants={rise}
        className="bg-[color:var(--wise-canvas-soft)] border border-[color:var(--wise-border)] rounded-[var(--wise-radius-lg)] p-6"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <Users size={18} className="text-[color:var(--wise-positive)]" />
          <span className="text-[13px] text-[color:var(--wise-body)]">End users</span>
        </div>
        <div className="text-[28px] font-bold text-[color:var(--wise-ink)] tracking-tight">{totalUsers}</div>
        <div className="text-[13px] text-[color:var(--wise-mute)] mt-1">Across every project</div>
      </motion.div>
    </motion.div>
  );
}
