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
    /** Whether image has been loaded into the token (null is a valid value). */
    imageSynced?: boolean;
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
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.image = user.image ?? null;
        token.imageSynced = true;
        if (user.name) token.name = user.name;
      }

      // Client called session.update({ image }) after photo upload
      if (trigger === "update" && session && typeof session === "object") {
        const s = session as { image?: string | null; name?: string };
        if ("image" in s) {
          token.image = s.image ?? null;
          token.imageSynced = true;
        }
        if (typeof s.name === "string" && s.name) {
          token.name = s.name;
        }
      }

      // Existing sessions: hydrate photo from DB once so initials don't stick
      if (token.id && !token.imageSynced) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { image: true, name: true, role: true },
        });
        if (dbUser) {
          token.image = dbUser.image;
          token.imageSynced = true;
          if (dbUser.name) token.name = dbUser.name;
          if (dbUser.role) token.role = dbUser.role;
        } else {
          token.imageSynced = true;
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
