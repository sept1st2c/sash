import { handlers } from "@/lib/auth";

/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * Mounts the NextAuth v5 handlers at /api/auth/*.
 * This handles:
 *   GET  /api/auth/session       → returns current JWT session
 *   POST /api/auth/signin        → dashboard login
 *   POST /api/auth/signout       → dashboard logout
 *   GET  /api/auth/csrf          → CSRF token
 */
export const { GET, POST } = handlers;


