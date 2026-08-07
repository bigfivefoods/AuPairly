/**
 * GET /api/social/facebook/oauth
 * Starts Meta OAuth (redirect) for the logged-in user.
 *
 * redirect_uri is always https://www.aupairly.me/api/social/facebook/callback
 * in production so it matches Meta App Domains + Valid OAuth Redirect URIs.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  facebookAppId,
  facebookAppSecret,
  facebookOAuthDialogUrl,
  facebookOAuthRedirectUri,
  facebookOAuthSiteUrl,
} from "@/lib/facebook";
import { randomBytes } from "node:crypto";

function safeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/settings/connections";
  }
  if (raw.startsWith("/api") || raw.startsWith("/login")) {
    return "/settings/connections";
  }
  return raw;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
  const site = facebookOAuthSiteUrl(req);

  const session = await auth();
  if (!session?.user) {
    const afterLogin = `/api/social/facebook/oauth?returnTo=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(
      `${site}/login?callbackUrl=${encodeURIComponent(afterLogin)}`
    );
  }

  if (!facebookAppId() || !facebookAppSecret()) {
    const msg = encodeURIComponent(
      "Facebook App not fully configured. Set NEXT_PUBLIC_FACEBOOK_APP_ID and AUTH_FACEBOOK_SECRET on the server."
    );
    return NextResponse.redirect(`${site}${returnTo}?fb=error&message=${msg}`);
  }

  // Exact string Meta must allow under Valid OAuth Redirect URIs
  // (always https://www.aupairly.me/... except localhost)
  const redirectUri = facebookOAuthRedirectUri(req);
  const state = randomBytes(16).toString("hex");

  const dialog = facebookOAuthDialogUrl({ redirectUri, state });
  if (!dialog) {
    const msg = encodeURIComponent("Could not build Facebook OAuth URL");
    return NextResponse.redirect(`${site}${returnTo}?fb=error&message=${msg}`);
  }

  const res = NextResponse.redirect(dialog);
  const secure = site.startsWith("https");
  const cookieBase = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set("fb_oauth_state", state, cookieBase);
  res.cookies.set("fb_oauth_return", returnTo, cookieBase);
  res.cookies.set("fb_oauth_redirect_uri", redirectUri, cookieBase);
  return res;
}
