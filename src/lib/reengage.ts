/**
 * Re-engagement rules based on last login / inactivity + profile stage.
 * Called from daily cron.
 */

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

const site = () =>
  (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "https://www.aupairly.me"
  ).replace(/\/$/, "");

export const REENGAGE_RULES = [
  {
    day: 30,
    subject: "Still looking for the right match on AuPairly?",
    title: "We saved your spot",
    bodyBase:
      "It's been a month — new sitters and hosts join every week. Log in to see who's near you.",
  },
  {
    day: 14,
    subject: "New people joined AuPairly near you",
    title: "Come back — new matches",
    bodyBase:
      "Two weeks away is a long time in a marketplace. Open Discover to see fresh listings.",
  },
  {
    day: 7,
    subject: "Your AuPairly matches are waiting",
    title: "It's been a week",
    bodyBase:
      "Log in to reply to messages and shortlist people before they go elsewhere.",
  },
  {
    day: 3,
    subject: "We miss you on AuPairly",
    title: "Quick check-in",
    bodyBase:
      "It's been a few days. A short login helps you stay visible and catch new interests.",
  },
] as const;

function daysSince(d: Date | null | undefined, fallback: Date): number {
  const base = d || fallback;
  return Math.floor((Date.now() - base.getTime()) / 86400000);
}

async function cityNewListings(city: string | null | undefined, days = 7) {
  if (!city?.trim()) return 0;
  const since = new Date(Date.now() - days * 86400000);
  const [s, h] = await Promise.all([
    prisma.auPairProfile.count({
      where: {
        status: "ACTIVE",
        city: { contains: city.trim(), mode: "insensitive" },
        createdAt: { gte: since },
      },
    }),
    prisma.familyProfile.count({
      where: {
        status: "ACTIVE",
        city: { contains: city.trim(), mode: "insensitive" },
        createdAt: { gte: since },
      },
    }),
  ]);
  return s + h;
}

/**
 * Send re-engagement for members inactive for 3 / 7 / 14 / 30 days.
 * - Skips users who published AND messaged in the last 7 days (goal met)
 * - Segments incomplete vs published profiles
 * - Personalizes with new listing count in their city
 */
export async function runReengageRules(opts?: { take?: number }) {
  const take = opts?.take ?? 120;
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  const users = await prisma.user.findMany({
    where: {
      role: { in: ["AUPAIR", "PARENT"] },
      suspendedAt: null,
      emailPrefMessages: { not: "OFF" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      lastLoginAt: true,
      lastActiveAt: true,
      createdAt: true,
      lastReengageDay: true,
      lastReengageAt: true,
      emailPrefMessages: true,
      aupairProfile: { select: { city: true, status: true } },
      familyProfile: { select: { city: true, status: true } },
    },
    take: 800,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  let skipped = 0;
  let skippedActive = 0;
  const byRule: Record<number, number> = { 3: 0, 7: 0, 14: 0, 30: 0 };
  const bySegment: Record<string, number> = {
    incomplete: 0,
    published: 0,
  };

  for (const u of users) {
    if (sent >= take) break;

    const profile = u.aupairProfile || u.familyProfile;
    const published = profile?.status === "ACTIVE";
    const city = profile?.city || null;

    // Goal-based skip: published + messaged recently → don't nag for login alone
    if (published) {
      const recentMsg = await prisma.message.count({
        where: {
          senderId: u.id,
          createdAt: { gte: weekAgo },
        },
      });
      if (recentMsg > 0) {
        skippedActive++;
        continue;
      }
    }

    const last = u.lastLoginAt || u.lastActiveAt || null;
    const idle = daysSince(last, u.createdAt);
    const rule = REENGAGE_RULES.find(
      (r) =>
        idle >= r.day && (u.lastReengageDay == null || u.lastReengageDay < r.day)
    );
    if (!rule) {
      skipped++;
      continue;
    }

    if (
      u.lastReengageAt &&
      Date.now() - u.lastReengageAt.getTime() < 2 * 86400000
    ) {
      skipped++;
      continue;
    }

    const first = (u.name || "there").split(" ")[0];
    const cityLabel = city || "your area";
    const newCount = await cityNewListings(city, 7);

    let body: string = rule.bodyBase;
    let href = "/discover";
    let subject: string = rule.subject;

    if (!published) {
      body =
        "Your listing still isn't live. Finish photo, city, and bio, then publish — profiles that go active get more matches.";
      href = "/profile/edit";
      subject =
        rule.day >= 7
          ? "Finish your AuPairly listing (2 minutes)"
          : "Almost there — publish your AuPairly listing";
      bySegment.incomplete++;
    } else {
      bySegment.published++;
      if (newCount > 0) {
        body = `${newCount} new listing${newCount === 1 ? "" : "s"} appeared near ${cityLabel} this week. ${rule.bodyBase}`;
      } else {
        body = `${rule.bodyBase} Invite 2 people in ${cityLabel} to grow local matches.`;
      }
    }

    const url = `${site()}${href}`;

    await createNotification({
      userId: u.id,
      type: "SYSTEM",
      title: rule.title,
      body,
      href,
    }).catch(() => null);

    if (u.email && u.emailPrefMessages !== "OFF") {
      void sendEmail({
        to: u.email,
        subject,
        text: `Hi ${first},\n\n${body}\n\nCity: ${cityLabel}${newCount ? ` · ${newCount} new nearby` : ""}\n\n${url}\n\nEmail prefs: ${site()}/settings/notifications\n`,
        html: `<p>Hi ${first},</p><p>${body}</p><p style="font-size:13px;color:#78716c">City: <strong>${cityLabel}</strong>${newCount ? ` · ${newCount} new nearby this week` : ""}</p><p style="margin:16px 0"><a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">${published ? "Open Discover" : "Finish listing"}</a></p><p style="font-size:12px;color:#78716c">Idle ~${rule.day} days. <a href="${site()}/settings/notifications">Email prefs</a></p>`,
      }).catch(() => null);
    }

    await prisma.user.update({
      where: { id: u.id },
      data: {
        lastReengageDay: rule.day,
        lastReengageAt: new Date(),
      },
    });

    sent++;
    byRule[rule.day] = (byRule[rule.day] || 0) + 1;
  }

  return {
    sent,
    skipped,
    skippedActive,
    byRule,
    bySegment,
    scanned: users.length,
  };
}
