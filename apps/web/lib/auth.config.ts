import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [], // Empty array for Edge compatibility. We add Credentials in auth.ts

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
} satisfies NextAuthConfig;
