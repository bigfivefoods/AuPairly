/**
 * GET /api/social/facebook/callback
 * Meta OAuth redirect handler — exchanges code, saves profile, returns user to app.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeFacebookCode,
  fetchFacebookProfile,
  facebookOAuthSiteUrl,
} from "@/lib/facebook";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const site = facebookOAuthSiteUrl(req);
  const session = await auth();
  const jar = await cookies();
  const returnTo = jar.get("fb_oauth_return")?.value || "/settings/connections";
  const expectedState = jar.get("fb_oauth_state")?.value || "";
  const storedRedirect =
    jar.get("fb_oauth_redirect_uri")?.value ||
    `${site}/api/social/facebook/callback`;

  const clear = (res: NextResponse) => {
    res.cookies.set("fb_oauth_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("fb_oauth_return", "", { path: "/", maxAge: 0 });
    res.cookies.set("fb_oauth_redirect_uri", "", { path: "/", maxAge: 0 });
    return res;
  };

  if (!session?.user) {
    return clear(
      NextResponse.redirect(`${site}/login?callbackUrl=/settings/connections`)
    );
  }

  const url = new URL(req.url);
  const err =
    url.searchParams.get("error_description") || url.searchParams.get("error");
  if (err) {
    return clear(
      NextResponse.redirect(
        `${site}${returnTo}?fb=error&message=${encodeURIComponent(err)}`
      )
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  if (!code) {
    return clear(
      NextResponse.redirect(
        `${site}${returnTo}?fb=error&message=${encodeURIComponent("Missing OAuth code")}`
      )
    );
  }
  if (!expectedState || state !== expectedState) {
    return clear(
      NextResponse.redirect(
        `${site}${returnTo}?fb=error&message=${encodeURIComponent("Invalid OAuth state")}`
      )
    );
  }

  try {
    const accessToken = await exchangeFacebookCode({
      code,
      redirectUri: storedRedirect,
    });
    const fb = await fetchFacebookProfile(accessToken);

    const existing = await prisma.user.findFirst({
      where: { facebookId: fb.id, NOT: { id: session.user.id } },
      select: { id: true },
    });
    if (existing) {
      return clear(
        NextResponse.redirect(
          `${site}${returnTo}?fb=error&message=${encodeURIComponent(
            "This Facebook account is already linked to another user"
          )}`
        )
      );
    }

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, name: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        facebookId: fb.id,
        facebookProfile: JSON.stringify({
          id: fb.id,
          name: fb.name,
          email: fb.email,
          picture: fb.pictureUrl,
          link: fb.link,
          importedAt: new Date().toISOString(),
        }),
        image: current?.image || fb.pictureUrl || undefined,
        name:
          !current?.name || current.name.length < 2 || current.name === "User"
            ? fb.name || current?.name
            : current?.name,
      },
    });

    return clear(NextResponse.redirect(`${site}${returnTo}?fb=linked`));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Facebook link failed";
    return clear(
      NextResponse.redirect(
        `${site}${returnTo}?fb=error&message=${encodeURIComponent(msg)}`
      )
    );
  }
}
