/**
 * Automated daily email + in-app alerts:
 * - Saved-search new listing alerts
 * - Placement review nudges (email + in-app)
 * - Placement day-7 / day-30 check-ins (email + in-app)
 * - Owner / management daily ops digest
 *
 * Vercel cron: 0 9 * * * (see vercel.json)
 * Auth: Authorization: Bearer CRON_SECRET (or ?secret=)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getManagementEmails } from "@/lib/management";

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
  let searchEmails = 0;
  const searches = await prisma.savedSearch.findMany({
    where: { alertEnabled: true },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    take: 200,
  });

  for (const s of searches) {
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

  // Review nudges — in-app + email (throttled by notification title / day)
  let reviewNudges = 0;
  let reviewEmails = 0;
  try {
    const { getPendingReviewsForUser } = await import("@/lib/pending-reviews");
    const activeUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            placementsAsParent: {
              some: { status: { in: ["PLACED", "COMPLETED", "TRIAL"] } },
            },
          },
          {
            placementsAsAupair: {
              some: { status: { in: ["PLACED", "COMPLETED", "TRIAL"] } },
            },
          },
        ],
      },
      select: { id: true, email: true, name: true },
      take: 100,
    });
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    for (const u of activeUsers) {
      const pending = await getPendingReviewsForUser(u.id);
      const placementPending = pending.filter((p) => p.source === "placement");
      if (placementPending.length === 0) continue;

      const already = await prisma.notification.findFirst({
        where: {
          userId: u.id,
          title: "Leave a review",
          createdAt: { gte: dayStart },
        },
      });
      if (already) continue;

      await createNotification({
        userId: u.id,
        type: "REVIEW",
        title: "Leave a review",
        body: `You have ${placementPending.length} placement review(s) waiting. Mutual reviews build trust.`,
        href: "/reviews",
      });
      reviewNudges++;

      if (u.email) {
        try {
          const { sendReviewNudgeEmail } = await import("@/lib/email");
          await sendReviewNudgeEmail({
            toEmail: u.email,
            toName: u.name || "there",
            count: placementPending.length,
          });
          reviewEmails++;
        } catch (e) {
          console.error("[cron alerts] review email", e);
        }
      }
    }
  } catch (e) {
    console.error("[cron alerts] review nudges", e);
  }

  // Placement day-7 / day-30 check-in nudges + email
  let checkInNudges = 0;
  let checkInEmails = 0;
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

      // Only email once per check-in creation
      const isNew = !existing;
      if (!existing) {
        await prisma.placementCheckIn.create({
          data: { placementId: p.id, dayOffset },
        });
      }

      // Throttle: only notify again if new check-in row
      if (!isNew) continue;

      const users = await prisma.user.findMany({
        where: { id: { in: [p.parentUserId, p.aupairUserId] } },
        select: { id: true, email: true, name: true },
      });

      for (const u of users) {
        await createNotification({
          userId: u.id,
          type: "SYSTEM",
          title: `Day ${dayOffset} check-in`,
          body: "How is the placement going? A quick update helps us support you.",
          href: `/placements/${p.id}`,
        });
        if (u.email) {
          try {
            const { sendPlacementCheckInEmail } = await import("@/lib/email");
            await sendPlacementCheckInEmail({
              toEmail: u.email,
              toName: u.name || "there",
              dayOffset,
              placementId: p.id,
            });
            checkInEmails++;
          } catch (e) {
            console.error("[cron alerts] check-in email", e);
          }
        }
      }
      checkInNudges++;
    }
  }

  // Owner / management daily ops digest
  let ownerDigests = 0;
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      signups24h,
      sittersActive,
      hostsActive,
      pendingVerifications,
      pendingReviews,
      openReports,
      messages24h,
      applications24h,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.auPairProfile.count({ where: { status: "ACTIVE" } }),
      prisma.familyProfile.count({ where: { status: "ACTIVE" } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { moderationStatus: "PENDING" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.message.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.applicationPacket.count({ where: { createdAt: { gte: dayAgo } } }),
    ]);

    const stats = {
      signups24h,
      sittersActive,
      hostsActive,
      pendingVerifications,
      pendingReviews,
      openReports,
      messages24h,
      applications24h,
    };

    const { sendOwnerDailyDigestEmail } = await import("@/lib/email");
    for (const toEmail of getManagementEmails()) {
      try {
        await sendOwnerDailyDigestEmail({ toEmail, stats });
        ownerDigests++;
      } catch (e) {
        console.error("[cron alerts] owner digest", toEmail, e);
      }
    }
  } catch (e) {
    console.error("[cron alerts] owner digest block", e);
  }

  // Queue SLA — escalate old verifications / reviews to management
  let slaAlerts = 0;
  try {
    const stale = new Date(Date.now() - 36 * 60 * 60 * 1000);
    const [staleV, staleR] = await Promise.all([
      prisma.verification.count({
        where: { status: "PENDING", createdAt: { lte: stale } },
      }),
      prisma.review.count({
        where: { moderationStatus: "PENDING", createdAt: { lte: stale } },
      }),
    ]);
    if (staleV > 0 || staleR > 0) {
      const { notifyManagement } = await import("@/lib/notify-management");
      await notifyManagement({
        subject: `Queue SLA: ${staleV} verifications · ${staleR} reviews`,
        title: "Queues need attention (36h+)",
        body: `${staleV} verification(s) and ${staleR} review(s) older than 36 hours are still pending.`,
        href: "/admin",
        ctaLabel: "Clear queues",
      });
      slaAlerts++;
    }
  } catch (e) {
    console.error("[cron alerts] SLA", e);
  }

  // Cron health — alert if sibling jobs stale >26h
  let cronHealthAlerts = 0;
  try {
    const { listCronRuns } = await import("@/lib/cron-run");
    const runs = await listCronRuns();
    const cutoff = Date.now() - 26 * 60 * 60 * 1000;
    const expected = ["activation", "match-digest", "expire-plans"];
    const staleJobs = expected.filter((job) => {
      const r = runs.find((x) => x.job === job);
      if (!r) return false; // never ran yet — skip until first success
      return new Date(r.lastRunAt).getTime() < cutoff || r.ok === false;
    });
    if (staleJobs.length) {
      const { notifyManagement } = await import("@/lib/notify-management");
      await notifyManagement({
        subject: `Cron health: ${staleJobs.join(", ")} stale`,
        title: "Cron job(s) need attention",
        body: `These jobs are missing or failed in the last 26h: ${staleJobs.join(", ")}. Check Vercel Cron + CRON_SECRET.`,
        href: "/manage",
        ctaLabel: "Open management",
      });
      cronHealthAlerts++;
    }
  } catch (e) {
    console.error("[cron alerts] cron health", e);
  }

  // Daily digest for members with emailPrefMessages === DAILY
  let dailyDigests = 0;
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyUsers = await prisma.user.findMany({
      where: {
        emailPrefMessages: "DAILY",
        suspendedAt: null,
        role: { in: ["AUPAIR", "PARENT"] },
      },
      select: { id: true, email: true, name: true },
      take: 150,
    });
    const { sendEmail } = await import("@/lib/email");
    const site = (
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"
    ).replace(/\/$/, "");
    for (const u of dailyUsers) {
      if (!u.email) continue;
      const [msgs, interests] = await Promise.all([
        prisma.message.count({
          where: {
            senderId: { not: u.id },
            createdAt: { gte: dayAgo },
            conversation: {
              OR: [{ userAId: u.id }, { userBId: u.id }],
            },
          },
        }),
        prisma.interest.count({
          where: { toUserId: u.id, createdAt: { gte: dayAgo }, status: "PENDING" },
        }),
      ]);
      if (msgs === 0 && interests === 0) continue;
      const first = (u.name || "there").split(" ")[0];
      void sendEmail({
        to: u.email,
        subject: `Your AuPairly daily digest`,
        text: `Hi ${first},\n\nIn the last day:\n• ${msgs} new message(s)\n• ${interests} new interest(s)\n\nOpen: ${site}/messages\n\nChange email frequency: ${site}/settings/notifications\n`,
        html: `<p>Hi ${first},</p><p>In the last day:</p><ul><li><strong>${msgs}</strong> new message(s)</li><li><strong>${interests}</strong> new interest(s)</li></ul><p><a href="${site}/messages">Open messages</a> · <a href="${site}/settings/notifications">Email prefs</a></p>`,
      }).catch(() => null);
      dailyDigests++;
    }
  } catch (e) {
    console.error("[cron alerts] daily digest", e);
  }

  const summary = {
    ok: true,
    searchAlerts,
    searchEmails,
    checkInNudges,
    checkInEmails,
    reviewNudges,
    reviewEmails,
    ownerDigests,
    slaAlerts,
    cronHealthAlerts,
    dailyDigests,
  };

  void import("@/lib/cron-run").then(({ recordCronRun }) =>
    recordCronRun("alerts", { ok: true, meta: summary })
  );

  return NextResponse.json(summary);
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
