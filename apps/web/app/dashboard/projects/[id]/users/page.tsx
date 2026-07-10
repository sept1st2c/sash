import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import UsersDirectoryView from "./UsersDirectoryView";

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
    <UsersDirectoryView
      projectId={projectId}
      projectName={project.name}
      users={users}
    />
  );
}
