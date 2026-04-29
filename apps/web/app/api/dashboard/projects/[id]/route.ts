/**
 * GET    /api/dashboard/projects/[id]   → get single project detail
 * PATCH  /api/dashboard/projects/[id]   → update webhookUrl or name
 * DELETE /api/dashboard/projects/[id]   → delete project (cascades users)
 *
 * All routes require an active NextAuth session AND ownership of the project.
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/middleware-helpers";

type Params = { params: Promise<{ id: string }> };

// ─── Ownership guard ──────────────────────────────────────────────────────────

async function getOwnedProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
  });
  return project;
}

// ─── GET — single project ─────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized.", 401);

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      apiKey: true,
      webhookUrl: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });

  if (!project) return jsonError("Project not found.", 404);

  return jsonSuccess({ project });
}

// ─── PATCH — update project ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized.", 401);

  const { id } = await params;
  const owned = await getOwnedProject(id, session.user.id);
  if (!owned) return jsonError("Project not found.", 404);

  let body: { name?: string; webhookUrl?: string | null };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const updateData: { name?: string; webhookUrl?: string | null } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 2) {
      return jsonError("Project name must be at least 2 characters.", 422);
    }
    updateData.name = body.name.trim();
  }

  if (body.webhookUrl !== undefined) {
    // Allow null to clear the webhook URL
    if (body.webhookUrl !== null && typeof body.webhookUrl !== "string") {
      return jsonError("webhookUrl must be a string or null.", 422);
    }
    updateData.webhookUrl = body.webhookUrl;
  }

  const project = await prisma.project.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      apiKey: true,
      webhookUrl: true,
      createdAt: true,
    },
  });

  return jsonSuccess({ project });
}

// ─── DELETE — remove project ──────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized.", 401);

  const { id } = await params;
  const owned = await getOwnedProject(id, session.user.id);
  if (!owned) return jsonError("Project not found.", 404);

  await prisma.project.delete({ where: { id } });

  return jsonSuccess({ success: true });
}
