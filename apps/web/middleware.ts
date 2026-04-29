/**
 * middleware.ts
 *
 * Next.js edge middleware — runs before every matching request.
 *
 * WHAT IT DOES:
 *   - Protects all /dashboard/* routes: redirects unauthenticated users to /login
 *   - Redirects authenticated users away from /login and /register to /dashboard
 *
 * WHY MIDDLEWARE (not layout auth checks):
 *   Middleware runs at the edge BEFORE the page renders — no flash of protected
 *   content is possible. Layout-level checks can leak page HTML briefly.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Protected routes — must be logged in
  const isProtected = pathname.startsWith("/dashboard");

  // Auth routes — should redirect away if already logged in
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
