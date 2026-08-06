import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

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
  ],
};
