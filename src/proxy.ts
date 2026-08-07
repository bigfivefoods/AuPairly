import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Next.js 16 Proxy (formerly middleware) — auth gate for private routes.
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/verification/:path*",
    "/messages/:path*",
    "/admin/:path*",
    "/interests/:path*",
    "/discover/:path*",
    "/billing/:path*",
    "/account",
    "/account/:path*",
    "/connect",
    "/connect/:path*",
    "/placements/:path*",
    "/trust/:path*",
    "/documents/:path*",
    "/boost/:path*",
    "/support/:path*",
    "/agency/:path*",
    "/coach/:path*",
    "/matches/:path*",
    "/shortlist/:path*",
    "/availability/:path*",
    "/saved-searches/:path*",
    "/applications/:path*",
    "/household/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/onboarding",
    "/reviews/:path*",
    "/reviews",
  ],
};
