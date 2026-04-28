/**
 * lib/prisma.ts
 *
 * Exports a singleton PrismaClient instance.
 *
 * WHY: Next.js hot-reloads re-execute module files in development.
 * Without this pattern, each reload creates a NEW PrismaClient and a new
 * database connection — quickly exhausting the PostgreSQL connection pool.
 *
 * PATTERN: We store the instance on `globalThis` (which persists across
 * hot-reloads). In production, modules are loaded once, so this is a no-op.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
