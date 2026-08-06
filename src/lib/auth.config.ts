import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma / Node APIs).
 * Used by middleware. Full credentials provider lives in auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const protectedPaths = [
        "/dashboard",
        "/profile",
        "/verification",
        "/messages",
        "/admin",
        "/interests",
      ];
      const isProtected = protectedPaths.some((p) => path.startsWith(p));
      if (isProtected) return !!auth?.user;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        if ("role" in user && user.role) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
