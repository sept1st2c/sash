import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ShieldAlert, BadgeCheck } from "lucide-react";
import UserActionsDropdown from "./UserActionsDropdown";

type Params = { params: Promise<{ id: string }> };

export const metadata = { title: "Users Directory — Sash" };

export default async function UsersDirectoryPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: projectId } = await params;

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
    select: { name: true },
  });

  if (!project) notFound();

  // Fetch all users for this project
  const users = await prisma.user.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <>
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors mb-7"
      >
        <ArrowLeft size={14} /> Back to {project.name}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-[color:var(--color-text-primary)]">
            Users Directory
          </h1>
          <p className="text-[14px] text-[color:var(--color-text-secondary)] mt-1">
            Manage the end-users registered to {project.name}
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-16 text-center shadow-sm">
          <Users size={40} className="text-[color:var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[15px] text-[color:var(--color-text-secondary)] mb-2 font-medium">
            No users yet
          </p>
          <p className="text-[13px] text-[color:var(--color-text-muted)]">
            Integrate the SDK into your app to start accepting signups.
          </p>
        </div>
      ) : (
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)]">
                  <th className="px-5 py-3 text-[12px] font-semibold text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold text-[color:var(--color-text-secondary)] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[color:var(--color-bg-subtle)]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-[color:var(--color-text-primary)]">
                          {user.email}
                        </span>
                        <span className="text-[11px] font-mono text-[color:var(--color-text-muted)] mt-0.5">
                          {user.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {!user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500">
                            <ShieldAlert size={12} /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500">
                            Active
                          </span>
                        )}
                        {user.emailVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-500">
                            <BadgeCheck size={12} /> Email Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] text-[color:var(--color-text-secondary)]">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
