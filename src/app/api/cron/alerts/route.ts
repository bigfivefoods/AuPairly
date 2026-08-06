/**
 * Daily saved-search alerts + placement check-in nudges.
 * Vercel cron: 0 9 * * * (see vercel.json)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

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

  const since = new Date();
  since.setDate(since.getDate() - 1);

  let searchAlerts = 0;
  const searches = await prisma.savedSearch.findMany({
    where: { alertEnabled: true },
    take: 200,
  });

  for (const s of searches) {
    let filters: Record<string, string> = {};
    try {
      filters = JSON.parse(s.filters);
    } catch {
      filters = {};
    }
    const city = filters.city || "";
    const country = filters.country || "";

    const count = await prisma.auPairProfile.count({
      where: {
        status: "ACTIVE",
        createdAt: { gte: since },
        ...(city ? { city: { contains: city } } : {}),
        ...(country ? { country: { contains: country } } : {}),
        ...(filters.verified === "1" ? { isVerified: true } : {}),
      },
    });

    if (count > 0) {
      await createNotification({
        userId: s.userId,
        type: "SYSTEM",
        title: `New matches for “${s.name}”`,
        body: `${count} new listing(s) in the last day match your saved search.`,
        href: `/browse/aupairs?q=${encodeURIComponent(city || "")}&country=${encodeURIComponent(country || "")}`,
      });
      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastAlertedAt: new Date() },
      });
      searchAlerts++;
    }
  }

  // Placement day-7 / day-30 check-in nudges
  let checkInNudges = 0;
  const placed = await prisma.placement.findMany({
    where: {
      status: { in: ["PLACED", "COMPLETED"] },
      placedAt: { not: null },
    },
    take: 100,
  });

  const now = Date.now();
  for (const p of placed) {
    if (!p.placedAt) continue;
    const days = Math.floor((now - p.placedAt.getTime()) / 86400000);
    for (const dayOffset of [7, 30] as const) {
      if (days < dayOffset) continue;
      const existing = await prisma.placementCheckIn.findUnique({
        where: {
          placementId_dayOffset: { placementId: p.id, dayOffset },
        },
      });
      if (existing?.respondedAt) continue;
      if (!existing) {
        await prisma.placementCheckIn.create({
          data: { placementId: p.id, dayOffset },
        });
      }
      for (const uid of [p.parentUserId, p.aupairUserId]) {
        await createNotification({
          userId: uid,
          type: "SYSTEM",
          title: `Day ${dayOffset} check-in`,
          body: "How is the placement going? A quick update helps us support you.",
          href: `/placements/${p.id}`,
        });
      }
      checkInNudges++;
    }
  }

  return NextResponse.json({ ok: true, searchAlerts, checkInNudges });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
