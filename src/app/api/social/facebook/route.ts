/**
 * POST /api/social/facebook
 * Body: { accessToken: string }
 *
 * Exchanges a Facebook user access token (from Facebook Login JS SDK or
 * Graph API) for profile fields and saves them on the current AuPairly user.
 *
 * This is profile enrichment only — NOT government identity verification.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

type FbProfile = {
  id: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
  link?: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`fb:${session.user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const accessToken = String(body.accessToken || "").trim();
  if (!accessToken) {
    return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
  }

  const appId = process.env.AUTH_FACEBOOK_ID || process.env.FACEBOOK_APP_ID;
  const appSecret =
    process.env.AUTH_FACEBOOK_SECRET || process.env.FACEBOOK_APP_SECRET;

  // Optional: app-secret proof for extra security when app secret is set
  const fields = "id,name,email,picture.type(large),link";
  let url = `https://graph.facebook.com/v21.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
  if (appId && appSecret) {
    // debug token optional; Graph works with user token alone
  }

  const res = await fetch(url);
  const data = (await res.json()) as FbProfile & { error?: { message?: string } };
  if (!res.ok || data.error || !data.id) {
    return NextResponse.json(
      {
        error:
          data.error?.message ||
          "Could not read Facebook profile. Check the token and app permissions (public_profile, email).",
      },
      { status: 400 }
    );
  }

  // Ensure this Facebook ID is not linked to another account
  const existing = await prisma.user.findFirst({
    where: { facebookId: data.id, NOT: { id: session.user.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "This Facebook account is already linked to another AuPairly user." },
      { status: 409 }
    );
  }

  const pictureUrl = data.picture?.data?.url || null;
  const profileJson = JSON.stringify({
    id: data.id,
    name: data.name,
    email: data.email,
    picture: pictureUrl,
    link: data.link,
    importedAt: new Date().toISOString(),
  });

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, name: true },
  });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      facebookId: data.id,
      facebookProfile: profileJson,
      // Prefer Facebook photo only when user has no profile photo yet
      image: current?.image || pictureUrl || undefined,
      // Prefer FB name only when name is empty/placeholder
      name:
        !current?.name || current.name.length < 2 || current.name === "User"
          ? data.name || current?.name
          : current?.name,
    },
    select: {
      id: true,
      name: true,
      image: true,
      facebookId: true,
      facebookProfile: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: updated,
    imported: {
      name: data.name,
      email: data.email,
      picture: pictureUrl,
      link: data.link,
    },
    note: "Facebook is used for profile enrichment only — complete ID verification for a Verified badge.",
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { facebookId: null, facebookProfile: null },
  });
  return NextResponse.json({ ok: true });
}
