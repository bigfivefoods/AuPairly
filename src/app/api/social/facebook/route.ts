/**
 * Facebook / Meta profile import for the logged-in AuPairly user.
 *
 * POST  { accessToken }  — import from JS SDK token
 * DELETE                 — unlink Facebook
 * GET                    — status for current user
 *
 * Profile enrichment only — NOT KYC.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  facebookPublicConfig,
  fetchFacebookProfile,
  isFacebookConfigured,
} from "@/lib/facebook";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      facebookId: true,
      facebookProfile: true,
      image: true,
      name: true,
    },
  });

  let profile: Record<string, unknown> | null = null;
  if (user?.facebookProfile) {
    try {
      profile = JSON.parse(user.facebookProfile) as Record<string, unknown>;
    } catch {
      profile = null;
    }
  }

  return NextResponse.json({
    config: facebookPublicConfig(),
    linked: Boolean(user?.facebookId),
    facebookId: user?.facebookId || null,
    profile,
    user: {
      name: user?.name,
      image: user?.image,
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!facebookPublicConfig().clientReady) {
    return NextResponse.json(
      {
        error:
          "Facebook is not configured. Set NEXT_PUBLIC_FACEBOOK_APP_ID and AUTH_FACEBOOK_SECRET on the server.",
      },
      { status: 503 }
    );
  }

  const rl = rateLimit(`fb:${session.user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { accessToken?: string; forcePhoto?: boolean; forceName?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const accessToken = String(body.accessToken || "").trim();
  if (!accessToken) {
    return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
  }

  let fb;
  try {
    fb = await fetchFacebookProfile(accessToken);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Facebook profile fetch failed" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { facebookId: fb.id, NOT: { id: session.user.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "This Facebook account is already linked to another AuPairly user.",
      },
      { status: 409 }
    );
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, name: true },
  });

  const profileJson = JSON.stringify({
    id: fb.id,
    name: fb.name,
    email: fb.email,
    picture: fb.pictureUrl,
    link: fb.link,
    importedAt: new Date().toISOString(),
  });

  const forcePhoto = Boolean(body.forcePhoto);
  const forceName = Boolean(body.forceName);
  const nextImage =
    forcePhoto && fb.pictureUrl
      ? fb.pictureUrl
      : current?.image || fb.pictureUrl || undefined;
  const nextName =
    forceName && fb.name
      ? fb.name
      : !current?.name || current.name.length < 2 || current.name === "User"
        ? fb.name || current?.name
        : current?.name;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      facebookId: fb.id,
      facebookProfile: profileJson,
      image: nextImage,
      name: nextName,
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
    configured: isFacebookConfigured(),
    user: updated,
    imported: {
      name: fb.name,
      email: fb.email,
      picture: fb.pictureUrl,
      link: fb.link,
    },
    note: "Facebook is for profile enrichment only — complete ID verification for a Verified badge.",
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
  return NextResponse.json({ ok: true, linked: false });
}
