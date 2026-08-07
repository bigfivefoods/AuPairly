/**
 * GET /api/social/facebook/oauth
 * Starts Meta OAuth (redirect) for the logged-in user.
 *
 * Query: ?returnTo=/verification  (optional safe path)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  facebookAppId,
  facebookAppSecret,
  facebookOAuthDialogUrl,
} from "@/lib/facebook";
import { getSiteUrl } from "@/lib/paystack";
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
  const site = getSiteUrl();

  const session = await auth();
  if (!session?.user) {
    const afterLogin = `/api/social/facebook/oauth?returnTo=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(
      `${site}/login?callbackUrl=${encodeURIComponent(afterLogin)}`
    );
  }

  if (!facebookAppId() || !facebookAppSecret()) {
    // Redirect with error (never return raw JSON for browser navigation)
    const msg = encodeURIComponent(
      "Facebook App not fully configured. Set NEXT_PUBLIC_FACEBOOK_APP_ID and AUTH_FACEBOOK_SECRET on the server."
    );
    return NextResponse.redirect(`${site}${returnTo}?fb=error&message=${msg}`);
  }

  const redirectUri = `${site}/api/social/facebook/callback`;
  const state = randomBytes(16).toString("hex");

  const dialog = facebookOAuthDialogUrl({ redirectUri, state });
  if (!dialog) {
    const msg = encodeURIComponent("Could not build Facebook OAuth URL");
    return NextResponse.redirect(`${site}${returnTo}?fb=error&message=${msg}`);
  }

  const res = NextResponse.redirect(dialog);
  // Short-lived cookies for CSRF state + where to land after
  const secure = site.startsWith("https");
  res.cookies.set("fb_oauth_state", state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("fb_oauth_return", returnTo, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
