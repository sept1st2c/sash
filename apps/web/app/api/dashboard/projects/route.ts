/**
 * GET  /api/dashboard/projects       → list all projects for the logged-in owner
 * POST /api/dashboard/projects       → create a new project
 *
 * Both routes require an active NextAuth dashboard session.
 *
 * GET RESPONSE (200):
 *   { "projects": [{ id, name, apiKey, webhookUrl, createdAt, _count: { users } }] }
 *
 * POST REQUEST BODY:
 *   { "name": "My App" }
 *
 * POST RESPONSE (201):
 *   { "project": { id, name, apiKey, webhookUrl, createdAt } }
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-key";
import { jsonError, jsonSuccess } from "@/lib/middleware-helpers";

// ─── GET — list projects ──────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized.", 401);

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      apiKey: true,
      webhookUrl: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess({ projects });
}

// ─── POST — create project ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized.", 401);

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const { name } = body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return jsonError("Project name must be at least 2 characters.", 422);
  }

  const apiKey = generateApiKey();

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      apiKey,
      ownerId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      apiKey: true,
      webhookUrl: true,
      createdAt: true,
    },
  });

  return jsonSuccess({ project }, 201);
}
