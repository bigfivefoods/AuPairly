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
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    take: 200,
  });

  let searchEmails = 0;

  for (const s of searches) {
    // Throttle: at most one alert per search per 20 hours
    if (s.lastAlertedAt) {
      const hours =
        (Date.now() - s.lastAlertedAt.getTime()) / (1000 * 60 * 60);
      if (hours < 20) continue;
    }

    let filters: Record<string, string> = {};
    try {
      filters = JSON.parse(s.filters);
    } catch {
      filters = {};
    }
    const city = filters.city || "";
    const country = filters.country || "";
    const targetFamilies = filters.target === "families";

    // AND city + country filters (do not overwrite a single OR)
    const whereBase = {
      status: "ACTIVE" as const,
      createdAt: { gte: since },
      ...(city
        ? { city: { contains: city, mode: "insensitive" as const } }
        : {}),
      ...(country
        ? { country: { contains: country, mode: "insensitive" as const } }
        : {}),
      ...(filters.verified === "1" ? { isVerified: true } : {}),
    };

    const count = targetFamilies
      ? await prisma.familyProfile.count({ where: whereBase })
      : await prisma.auPairProfile.count({ where: whereBase });

    if (count > 0) {
      const base = targetFamilies ? "/browse/families" : "/browse/aupairs";
      const q = new URLSearchParams();
      if (city) q.set("city", city);
      if (country) q.set("country", country);
      if (filters.verified === "1") q.set("verified", "1");
      const href = `${base}?${q.toString()}`;
      const targetLabel = targetFamilies ? "host" : "sitter";

      await createNotification({
        userId: s.userId,
        type: "SYSTEM",
        title: `New matches for “${s.name}”`,
        body: `${count} new ${targetLabel} listing(s) in the last day match your saved search.`,
        href,
      });

      // Email when Resend is configured
      if (s.user?.email) {
        try {
          const { sendSavedSearchAlertEmail } = await import("@/lib/email");
          const site = (
            process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"
          ).replace(/\/$/, "");
          await sendSavedSearchAlertEmail({
            toEmail: s.user.email,
            toName: s.user.name || "there",
            searchName: s.name,
            count,
            targetLabel,
            href: `${site}${href}`,
          });
          searchEmails++;
        } catch (e) {
          console.error("[cron alerts] search email", e);
        }
      }

      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastAlertedAt: new Date() },
      });
      searchAlerts++;
    }
  }

  // Nudge users who still owe placement/message reviews
  let reviewNudges = 0;
  try {
    const { getPendingReviewsForUser } = await import("@/lib/pending-reviews");
    const activeUsers = await prisma.user.findMany({
      where: {
        OR: [
          { placementsAsParent: { some: { status: { in: ["PLACED", "COMPLETED", "TRIAL"] } } } },
          { placementsAsAupair: { some: { status: { in: ["PLACED", "COMPLETED", "TRIAL"] } } } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    for (const u of activeUsers) {
      const pending = await getPendingReviewsForUser(u.id);
      const placementPending = pending.filter((p) => p.source === "placement");
      if (placementPending.length === 0) continue;
      await createNotification({
        userId: u.id,
        type: "REVIEW",
        title: "Leave a review",
        body: `You have ${placementPending.length} placement review(s) waiting. Mutual reviews build trust.`,
        href: "/reviews",
      });
      reviewNudges++;
    }
  } catch (e) {
    console.error("[cron alerts] review nudges", e);
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

  return NextResponse.json({
    ok: true,
    searchAlerts,
    searchEmails,
    checkInNudges,
    reviewNudges,
  });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
