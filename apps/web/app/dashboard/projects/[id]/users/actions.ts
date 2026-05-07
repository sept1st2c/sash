"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateAllUserSessions } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Ensures the currently logged in user actually owns the project 
 * before allowing any mutation on the project's end-users.
 */
async function verifyProjectOwnership(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });

  if (!project) throw new Error("Forbidden");
  return project;
}

export async function suspendUser(projectId: string, userId: string, suspend: boolean) {
  await verifyProjectOwnership(projectId);

  await prisma.user.update({
    where: { id: userId, projectId },
    data: { isActive: !suspend },
  });

  if (suspend) {
    // Instantly log them out everywhere
    await invalidateAllUserSessions(userId);
  }

  revalidatePath(`/dashboard/projects/${projectId}/users`);
}

export async function deleteUser(projectId: string, userId: string) {
  await verifyProjectOwnership(projectId);

  // Hard delete the user
  await prisma.user.delete({
    where: { id: userId, projectId },
  });

  // Clean up sessions
  await invalidateAllUserSessions(userId);

  revalidatePath(`/dashboard/projects/${projectId}/users`);
}
