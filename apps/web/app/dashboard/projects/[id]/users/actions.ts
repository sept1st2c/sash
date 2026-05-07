"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateAllUserSessions } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function suspendUserAction(userId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });
  if (!project) throw new Error("Project not found");

  // Toggle isActive
  const user = await prisma.user.findFirst({
    where: { id: userId, projectId },
  });
  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  // If suspending, destroy all their sessions
  if (user.isActive) {
    await invalidateAllUserSessions(userId);
  }

  revalidatePath(`/dashboard/projects/${projectId}/users`);
}

export async function deleteUserAction(userId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });
  if (!project) throw new Error("Project not found");

  // Delete user and cascade sessions
  await prisma.user.delete({
    where: { id: userId, projectId },
  });
  await invalidateAllUserSessions(userId);

  revalidatePath(`/dashboard/projects/${projectId}/users`);
}
