/**
 * prisma/seed-demo.ts
 *
 * One-off, manually-run script that provisions the dedicated demo tenant
 * used by the landing page's live sandbox (`components/landing/LiveDemo.tsx`).
 *
 * WHAT IT DOES:
 *   - Ensures a ProjectOwner (email: demo@sash.dev) exists. This account is
 *     never meant to be logged into — its passwordHash is a bcrypt hash of a
 *     random 32-byte value that is never printed or stored anywhere.
 *   - Ensures that owner has exactly one Project named "Sash Demo" with a
 *     real `sash_live_...` API key generated via the same `generateApiKey()`
 *     used by every other project.
 *   - Idempotent: safe to re-run. If the owner/project already exist, it
 *     prints the existing API key instead of creating a duplicate.
 *
 * USAGE (run manually, from the repo root):
 *   npx tsx apps/web/prisma/seed-demo.ts
 *
 * This script is NOT imported by any app code path and does NOT run
 * automatically — it must be invoked by hand, once, against whichever
 * database DATABASE_URL points at (apps/web/.env — which in this project
 * IS the production Neon database, there is no separate local DB).
 *
 * After running, copy the printed API key into apps/web/.env as
 * NEXT_PUBLIC_SASH_DEMO_API_KEY — this script deliberately does not write
 * to .env itself.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load apps/web/.env explicitly — this script may be run from the repo
// root (`npx tsx apps/web/prisma/seed-demo.ts`), so we can't rely on
// dotenv's default cwd-relative lookup finding it.
loadEnv({ path: path.resolve(__dirname, "../.env") });

const DEMO_OWNER_EMAIL = "demo@sash.dev";
const DEMO_PROJECT_NAME = "Sash Demo";
const BCRYPT_COST_FACTOR = 12; // matches apps/web/app/api/dashboard/register/route.ts

async function main() {
  // Imported dynamically, after env vars are loaded, so lib/prisma.ts reads
  // a populated DATABASE_URL when its module-level Pool is constructed.
  const { prisma } = await import("../lib/prisma");
  const { generateApiKey } = await import("../lib/api-key");

  const existingOwner = await prisma.projectOwner.findUnique({
    where: { email: DEMO_OWNER_EMAIL },
    include: { projects: true },
  });

  if (existingOwner) {
    const existingProject = existingOwner.projects.find(
      (p) => p.name === DEMO_PROJECT_NAME
    );

    if (existingProject) {
      printResult({
        ownerId: existingOwner.id,
        projectId: existingProject.id,
        apiKey: existingProject.apiKey,
        created: false,
      });
      return;
    }

    // Owner exists but is somehow missing its demo project — create just
    // the project rather than a second owner.
    const project = await prisma.project.create({
      data: {
        name: DEMO_PROJECT_NAME,
        apiKey: generateApiKey(),
        ownerId: existingOwner.id,
      },
    });

    printResult({
      ownerId: existingOwner.id,
      projectId: project.id,
      apiKey: project.apiKey,
      created: true,
    });
    return;
  }

  // Random, never-usable password. This account is not a real login path —
  // it exists only so a Project can have an owner.
  const unusablePassword = randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(unusablePassword, BCRYPT_COST_FACTOR);

  const owner = await prisma.projectOwner.create({
    data: {
      email: DEMO_OWNER_EMAIL,
      passwordHash,
      projects: {
        create: {
          name: DEMO_PROJECT_NAME,
          apiKey: generateApiKey(),
        },
      },
    },
    include: { projects: true },
  });

  const project = owner.projects[0];

  printResult({
    ownerId: owner.id,
    projectId: project.id,
    apiKey: project.apiKey,
    created: true,
  });
}

function printResult(result: {
  ownerId: string;
  projectId: string;
  apiKey: string;
  created: boolean;
}) {
  const divider = "=".repeat(64);
  console.log(divider);
  console.log(
    result.created
      ? " Sash demo project created"
      : " Sash demo project already exists (no changes made)"
  );
  console.log(divider);
  console.log(` ProjectOwner : ${DEMO_OWNER_EMAIL} (id: ${result.ownerId})`);
  console.log(` Project      : ${DEMO_PROJECT_NAME} (id: ${result.projectId})`);
  console.log(` API Key      : ${result.apiKey}`);
  console.log("");
  console.log(" Add this line to apps/web/.env:");
  console.log("");
  console.log(`   NEXT_PUBLIC_SASH_DEMO_API_KEY=${result.apiKey}`);
  console.log("");
  console.log(divider);
}

main()
  .catch((err: unknown) => {
    console.error("[seed-demo] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
