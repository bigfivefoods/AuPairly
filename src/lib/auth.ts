import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    /** Profile photo URL from User.image */
    image?: string | null;
    /** Active LoginSession id for duration tracking */
    loginSessionId?: string | null;
    /** Last heartbeat epoch ms */
    lastBeat?: number;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Ensure secret is always present (inherited from authConfig, explicit for Node runtime)
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    authConfig.secret,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Block suspended accounts at login
        if (user.suspendedAt) {
          return null;
        }

        // Login monitoring: open session + lastLoginAt / loginCount
        try {
          const { startLoginSession } = await import("@/lib/login-sessions");
          const sessionId = await startLoginSession({ userId: user.id });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            // carried into jwt via user object fields we stash below
            ...(sessionId ? { loginSessionId: sessionId } : {}),
          } as {
            id: string;
            email: string;
            name: string;
            role: Role;
            image: string | null;
            loginSessionId?: string;
          };
        } catch {
          void prisma.user
            .update({
              where: { id: user.id },
              data: { lastActiveAt: new Date(), lastLoginAt: new Date() },
            })
            .catch(() => null);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      try {
        const { endLoginSession } = await import("@/lib/login-sessions");
        const token =
          message && typeof message === "object" && "token" in message
            ? (message as { token?: { id?: string; loginSessionId?: string } })
                .token
            : undefined;
        await endLoginSession({
          userId: token?.id,
          sessionId: token?.loginSessionId,
        });
      } catch (e) {
        console.warn("[auth] signOut session end", e);
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.image = user.image ?? null;
        if (user.name) token.name = user.name;
        const sid = (user as { loginSessionId?: string }).loginSessionId;
        if (sid) token.loginSessionId = sid;
        token.lastBeat = Date.now();
      }

      // Client called session.update({ image }) after photo upload
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { image?: string | null; name?: string };
        if ("image" in s) {
          token.image = s.image ?? null;
        }
        if (typeof s.name === "string" && s.name) {
          token.name = s.name;
        }
      }

      // Always refresh photo from DB so uploads show after login/reload
      // (JWT alone can stay stuck with null image from the pre-upload session).
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { image: true, name: true, role: true },
          });
          if (dbUser) {
            token.image = dbUser.image ?? null;
            if (dbUser.name) token.name = dbUser.name;
            if (dbUser.role) token.role = dbUser.role;
          }
        } catch (e) {
          console.warn("[auth jwt] failed to refresh user image", e);
        }

        // Session heartbeat for “time logged in” monitoring (throttled)
        const now = Date.now();
        if (!token.lastBeat || now - token.lastBeat > 4 * 60 * 1000) {
          token.lastBeat = now;
          void import("@/lib/login-sessions").then(({ heartbeatLoginSession }) =>
            heartbeatLoginSession({
              userId: token.id as string,
              sessionId: token.loginSessionId,
            })
          );
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.image = (token.image as string | null | undefined) ?? null;
        if (typeof token.name === "string" && token.name) {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
