/**
 * lib/api-key.ts
 *
 * Handles API key generation and validation. This is the MULTI-TENANCY GATE —
 * every public API request must include a valid API key so we know which
 * Project (tenant) the request belongs to.
 *
 * KEY FORMAT:
 *   sash_live_<64 hex characters>
 *   e.g. sash_live_a1b2c3d4...
 *
 * HOW VALIDATION WORKS:
 *   1. Extract the Bearer token from the Authorization header.
 *   2. Look up the Project by apiKey in PostgreSQL.
 *   3. If found, return the full Project row (used throughout the request).
 *   4. If not found, throw a 401 error.
 *
 * EXPORTED FUNCTIONS:
 *   generateApiKey()       → generates a new unique API key string
 *   validateApiKey(req)    → returns Project or throws ApiKeyError
 */

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import type { Project } from "@prisma/client";

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class ApiKeyError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "ApiKeyError";
    this.statusCode = statusCode;
  }
}

// ─── Key Generator ────────────────────────────────────────────────────────────

/**
 * generateApiKey
 *
 * Creates a cryptographically secure random API key.
 * The `sash_live_` prefix makes it easy to identify and search for leaked keys.
 */
export function generateApiKey(): string {
  return `sash_live_${randomBytes(32).toString("hex")}`;
}

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * validateApiKey
 *
 * Extracts the Bearer token from the Authorization header and validates it
 * against the Project table. Returns the full Project row so downstream
 * handlers can use project.id, project.webhookUrl, etc.
 *
 * Throws ApiKeyError (401) if the header is missing or the key is invalid.
 */
export async function validateApiKey(req: NextRequest): Promise<Project> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiKeyError("Missing Authorization header. Expected: Bearer <api_key>");
  }

  const apiKey = authHeader.slice(7).trim(); // remove "Bearer "

  if (!apiKey) {
    throw new ApiKeyError("API key is empty.");
  }

  const project = await prisma.project.findUnique({
    where: { apiKey },
  });

  if (!project) {
    throw new ApiKeyError("Invalid API key.");
  }

  return project;
}
