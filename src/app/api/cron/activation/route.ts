/**
 * Activation lifecycle emails:
 * - Day 1 (~20–32h after signup): checklist + nearby count
 * - Day 3 (~60–84h): complete-profile nudge if incomplete
 *
 * Vercel cron: daily (see vercel.json)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  sendDay1ActivationEmail,
  sendCompleteProfileEmail,
} from "@/lib/email";
import { computeCompleteness } from "@/lib/completeness";
import { recordCronRun } from "@/lib/cron-run";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = new URL(req.url);
  const q = url.searchParams.get("secret") || "";
  return bearer === secret || q === secret;
}

async function handleDay1() {
  const now = Date.now();
  const from = new Date(now - 32 * 60 * 60 * 1000);
  const to = new Date(now - 20 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      role: { in: ["AUPAIR", "PARENT"] },
      suspendedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      aupairProfile: {
        select: { city: true, status: true, headline: true, bio: true },
      },
      familyProfile: {
        select: { city: true, status: true, headline: true, bio: true },
      },
    },
    take: 150,
  });

  let emails = 0;
  let notifications = 0;
  let skippedReady = 0;

  for (const u of users) {
    const profile = u.aupairProfile || u.familyProfile;
    // Skip fully active members who already published with a photo
    if (
      profile?.status === "ACTIVE" &&
      u.image &&
      profile.city &&
      (profile.headline || profile.bio)
    ) {
      skippedReady++;
      continue;
    }

    const already = await prisma.notification.findFirst({
      where: {
        userId: u.id,
        title: "Day 1 checklist",
        createdAt: { gte: from },
      },
    });
    if (already) continue;

    const city = u.aupairProfile?.city || u.familyProfile?.city || null;
    let nearbyCount = 0;
    if (city) {
      if (u.role === "PARENT") {
        nearbyCount = await prisma.auPairProfile.count({
          where: {
            status: "ACTIVE",
            city: { contains: city, mode: "insensitive" },
          },
        });
      } else {
        nearbyCount = await prisma.familyProfile.count({
          where: {
            status: "ACTIVE",
            city: { contains: city, mode: "insensitive" },
          },
        });
      }
    }

    await createNotification({
      userId: u.id,
      type: "SYSTEM",
      title: "Day 1 checklist",
      body:
        nearbyCount > 0
          ? `${nearbyCount} people near ${city} — finish photo, publish, and send 3 messages.`
          : "Finish photo → city → publish, then Discover matches.",
      href: "/dashboard",
    }).catch(() => null);
    notifications++;

    try {
      await sendDay1ActivationEmail({
        toEmail: u.email,
        toName: u.name,
        role: u.role,
        city,
        nearbyCount,
      });
      emails++;
    } catch (e) {
      console.error("[cron activation] day1 email", e);
    }
  }

  return { scanned: users.length, emails, notifications, skippedReady };
}

async function handleDay3CompleteProfile() {
  const now = Date.now();
  const from = new Date(now - 84 * 60 * 60 * 1000); // 3.5 days
  const to = new Date(now - 60 * 60 * 60 * 1000); // 2.5 days

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      role: { in: ["AUPAIR", "PARENT"] },
      suspendedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      aupairProfile: true,
      familyProfile: true,
    },
    take: 150,
  });

  let emails = 0;
  let notifications = 0;
  let skipped = 0;

  for (const u of users) {
    const profile = u.aupairProfile || u.familyProfile;
    if (!profile) {
      // still no profile row — strong nudge
    } else if (profile.status === "ACTIVE" && u.image && profile.city) {
      const c = computeCompleteness({
        role: u.role,
        name: u.name,
        image: u.image,
        headline: profile.headline,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
        languages: profile.languages,
        status: profile.status,
        isVerified: profile.isVerified,
        services: profile.services,
      });
      if (c.percent >= 70) {
        skipped++;
        continue;
      }
    }

    const already = await prisma.notification.findFirst({
      where: {
        userId: u.id,
        title: "Complete your profile",
        createdAt: { gte: from },
      },
    });
    if (already) {
      skipped++;
      continue;
    }

    let percent: number | undefined;
    if (profile) {
      percent = computeCompleteness({
        role: u.role,
        name: u.name,
        image: u.image,
        headline: profile.headline,
        bio: profile.bio,
        city: profile.city,
        country: profile.country,
        languages: profile.languages,
        status: profile.status,
        isVerified: profile.isVerified,
        services: profile.services,
      }).percent;
    }

    await createNotification({
      userId: u.id,
      type: "SYSTEM",
      title: "Complete your profile",
      body:
        percent != null
          ? `You're at ${percent}% — add a photo and bio to unlock more matches.`
          : "Add a photo and bio so hosts and sitters can find you.",
      href: "/profile/edit",
    }).catch(() => null);
    notifications++;

    try {
      await sendCompleteProfileEmail({
        email: u.email,
        name: u.name,
        percent,
      });
      emails++;
    } catch (e) {
      console.error("[cron activation] day3 email", e);
    }
  }

  return { scanned: users.length, emails, notifications, skipped };
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day1 = await handleDay1();
  const day3 = await handleDay3CompleteProfile();

  const summary = { ok: true, day1, day3 };
  void recordCronRun("activation", { ok: true, meta: summary as unknown as Record<string, unknown> });

  return NextResponse.json(summary);
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
