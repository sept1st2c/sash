"use client";

import { motion, type Variants } from "motion/react";
import Link from "next/link";
import { ArrowLeft, Users, ShieldAlert, BadgeCheck, CircleDashed } from "lucide-react";
import UserActionsDropdown from "./UserActionsDropdown";

interface DirectoryUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function UsersDirectoryView({
  projectId,
  projectName,
  users,
}: {
  projectId: string;
  projectName: string;
  users: DirectoryUser[];
}) {
  return (
    <>
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-[13px] transition-colors mb-7"
        style={{ color: "var(--wise-mute)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--wise-ink)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--wise-mute)")}
      >
        <ArrowLeft size={14} /> Back to {projectName}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1
            className="text-[24px] tracking-tight"
            style={{ fontFamily: "var(--font-wise-display)", fontWeight: 900, color: "var(--wise-ink)" }}
          >
            Users
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "var(--wise-body)" }}>
            Everyone who has signed up through {projectName}.
          </p>
        </div>
      </motion.div>

      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-[var(--wise-radius-xl)] p-16 text-center"
          style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
        >
          <Users size={36} style={{ color: "var(--wise-mute)" }} className="mx-auto mb-4" />
          <p className="text-[15px] mb-2 font-medium" style={{ color: "var(--wise-ink)" }}>
            No users yet
          </p>
          <p className="text-[13px]" style={{ color: "var(--wise-mute)" }}>
            Wire the SDK into your app and signups will start showing up here.
          </p>
        </motion.div>
      ) : (
        <div
          className="rounded-[var(--wise-radius-xl)] overflow-hidden"
          style={{ backgroundColor: "var(--wise-canvas-soft)", border: "1px solid var(--wise-border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: "var(--wise-surface-alt)", borderBottom: "1px solid var(--wise-border)" }}>
                  <th
                    className="px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--wise-mute)" }}
                  >
                    User
                  </th>
                  <th
                    className="px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--wise-mute)" }}
                  >
                    Status
                  </th>
                  <th
                    className="px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: "var(--wise-mute)" }}
                  >
                    Joined
                  </th>
                  <th
                    className="px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-right"
                    style={{ color: "var(--wise-mute)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <motion.tbody variants={container} initial="hidden" animate="show">
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    variants={rise}
                    className="transition-colors hover:bg-[color:var(--wise-surface-alt)]"
                    style={{ borderBottom: "1px solid var(--wise-border)" }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-medium truncate" style={{ color: "var(--wise-ink)" }}>
                          {user.email}
                        </span>
                        <span className="text-[11px] font-mono mt-0.5" style={{ color: "var(--wise-mute)" }}>
                          {user.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 items-start">
                        {user.isActive ? (
                          <StatusPill tone="positive" label="Active" />
                        ) : (
                          <StatusPill tone="negative" label="Suspended" icon={<ShieldAlert size={12} />} />
                        )}
                        {user.emailVerified ? (
                          <StatusPill tone="positive" label="Verified" icon={<BadgeCheck size={12} />} />
                        ) : (
                          <StatusPill tone="muted" label="Unverified" icon={<CircleDashed size={12} />} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px]" style={{ color: "var(--wise-body)" }}>
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <UserActionsDropdown
                        projectId={projectId}
                        userId={user.id}
                        isActive={user.isActive}
                      />
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function StatusPill({
  tone,
  label,
  icon,
}: {
  tone: "positive" | "negative" | "muted";
  label: string;
  icon?: React.ReactNode;
}) {
  const style =
    tone === "positive"
      ? { backgroundColor: "rgba(159,232,112,0.12)", color: "var(--wise-primary)" }
      : tone === "negative"
        ? { backgroundColor: "var(--wise-negative-bg)", color: "var(--wise-negative)" }
        : { backgroundColor: "var(--wise-surface-alt)", color: "var(--wise-mute)" };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--wise-radius-pill)] text-[11px] font-medium whitespace-nowrap"
      style={style}
    >
      {icon}
      {label}
    </span>
  );
}
