import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ShieldAlert, CheckCircle2 } from "lucide-react";
import UserActionsDropdown from "./UserActionsDropdown";

type Params = { params: Promise<{ id: string }> };

export default async function UsersDirectoryPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
    select: { name: true, id: true },
  });

  if (!project) notFound();

  const users = await prisma.user.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
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
          <h1 className="text-[22px] font-bold tracking-tight text-[color:var(--color-text-primary)]">User Directory</h1>
          <p className="text-[14px] text-[color:var(--color-text-secondary)] mt-1">Manage users registered via {project.name}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] p-16 text-center shadow-sm">
          <Users size={40} className="text-[color:var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[15px] text-[color:var(--color-text-secondary)] mb-2 font-medium">No users yet</p>
          <p className="text-[13px] text-[color:var(--color-text-muted)]">Users will appear here once they sign up through your app.</p>
        </div>
      ) : (
        <div className="bg-[color:var(--color-bg-surface)] border border-[color:var(--color-border-subtle)] rounded-[16px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-subtle)]">
                  <th className="px-6 py-4 text-[12px] font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-[color:var(--color-text-secondary)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--color-border-subtle)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[color:var(--color-bg-subtle)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-[color:var(--color-text-primary)]">{u.email}</span>
                        <span className="text-[12px] text-[color:var(--color-text-muted)] mt-0.5">
                          {u.emailVerified ? "Verified email" : "Unverified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-500">
                          <ShieldAlert size={12} /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[color:var(--color-text-secondary)]">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <UserActionsDropdown userId={u.id} projectId={projectId} isActive={u.isActive} />
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
