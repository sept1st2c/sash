/**
 * POST /api/dashboard/register
 *
 * Creates a new ProjectOwner account (developer registration for the dashboard).
 * This is separate from end-user signup — this is for DEVELOPERS using Sash.
 *
 * REQUEST BODY:
 *   { "email": "dev@example.com", "password": "..." }
 *
 * RESPONSE (201):
 *   { "owner": { "id", "email", "createdAt" } }
 *
 * ERRORS:
 *   409 — email already registered
 *   422 — invalid body
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/middleware-helpers";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 422);
  }

  const { email, password } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return jsonError("A valid email is required.", 422);
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return jsonError("Password must be at least 8 characters.", 422);
  }

  const existing = await prisma.projectOwner.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return jsonError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const owner = await prisma.projectOwner.create({
    data: { email: email.toLowerCase(), passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  return jsonSuccess({ owner }, 201);
}
