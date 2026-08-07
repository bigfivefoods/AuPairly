import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma / Node APIs).
 * Used by middleware. Full credentials provider lives in auth.ts.
 *
 * AUTH_SECRET must be set on Vercel Production. A deterministic fallback
 * keeps marketing pages loading if env is misconfigured (sessions will not
 * be stable across deploys until a real secret is set).
 */
function resolveAuthSecret(): string {
  const s =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET_FALLBACK;
  if (s && s.length >= 16) return s;
  // Build-time / misconfigured prod — site must still render public pages
  return "aupairly-temporary-secret-set-AUTH_SECRET-on-vercel";
}

export const authConfig = {
  secret: resolveAuthSecret(),
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
        "/discover",
        "/billing",
        "/onboarding",
        "/placements",
        "/trust",
        "/documents",
        "/boost",
        "/matches",
        "/shortlist",
        "/applications",
        "/settings",
        "/connect",
        "/agency",
        "/reviews",
      ];
      const isProtected = protectedPaths.some((p) => path.startsWith(p));
      if (isProtected) return !!auth?.user;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        if ("role" in user && user.role) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).role = user.role;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).image = user.image ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).imageSynced = true;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { image?: string | null };
        if ("image" in s) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).image = s.image ?? null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).imageSynced = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = (token as any).role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.image = ((token as any).image as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
