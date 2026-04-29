/**
 * lib/auth.ts
 *
 * NextAuth v5 configuration for the Developer Dashboard.
 *
 * This handles authentication for PROJECT OWNERS (developers who sign up
 * to the Sash dashboard) — completely separate from the end-users of their apps.
 *
 * STRATEGY: Credentials provider with email+password.
 * We manually look up the ProjectOwner in Postgres and verify bcrypt hash.
 *
 * EXPORTS:
 *   handlers   — GET/POST route handlers mounted at /api/auth/[...nextauth]
 *   auth       — server-side session getter (use in Server Components + API routes)
 *   signIn     — programmatic sign-in
 *   signOut    — programmatic sign-out
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const owner = await prisma.projectOwner.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!owner) return null;

        const valid = await bcrypt.compare(password, owner.passwordHash);
        if (!valid) return null;

        return { id: owner.id, email: owner.email };
      },
    }),
  ],

  callbacks: {
    // Persist the owner id onto the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    // Make id available on session.user
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
