/**
 * GET /api/social/facebook/oauth
 * Starts Meta OAuth (redirect) for the logged-in user.
 *
 * Query: ?returnTo=/verification  (optional safe path)
 *
 * redirect_uri is built from the *request host* (not a stale env URL)
 * so it matches Meta App Domains for www.aupairly.me.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  facebookAppId,
  facebookAppSecret,
  facebookOAuthDialogUrl,
} from "@/lib/facebook";
import { getRequestSiteUrl } from "@/lib/paystack";
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
  const site = getRequestSiteUrl(req);

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

  // Must exactly match a Valid OAuth Redirect URI in Meta
  const redirectUri = `${site}/api/social/facebook/callback`;
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
  // Same redirect_uri must be used on code exchange
  res.cookies.set("fb_oauth_redirect_uri", redirectUri, cookieBase);
  return res;
}
