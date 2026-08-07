/**
 * Day-1 activation emails for new members (≈20–32h after signup).
 * Vercel cron: daily (see vercel.json)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendDay1ActivationEmail } from "@/lib/email";

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

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      aupairProfile: { select: { city: true, status: true } },
      familyProfile: { select: { city: true, status: true } },
    },
    take: 150,
  });

  let emails = 0;
  let notifications = 0;

  for (const u of users) {
    // Skip if we already sent a day-1 style system note recently
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
      console.error("[cron activation] email", e);
    }
  }

  return NextResponse.json({ ok: true, scanned: users.length, emails, notifications });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
