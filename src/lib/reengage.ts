/**
 * Re-engagement rules based on last login / inactivity.
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

/** Day buckets: first matching rule wins (most severe first when scanning). */
export const REENGAGE_RULES = [
  {
    day: 30,
    subject: "Still looking for the right match on AuPairly?",
    title: "We saved your spot",
    body: "It's been a month — new sitters and hosts join every week. Log in to see who's near you.",
  },
  {
    day: 14,
    subject: "New people joined AuPairly near you",
    title: "Come back — new matches",
    body: "Two weeks away is a long time in a marketplace. Open Discover to see fresh listings.",
  },
  {
    day: 7,
    subject: "Your AuPairly matches are waiting",
    title: "It's been a week",
    body: "Log in to reply to messages and shortlist people before they go elsewhere.",
  },
  {
    day: 3,
    subject: "We miss you on AuPairly",
    title: "Quick check-in",
    body: "It's been a few days. A short login helps you stay visible and catch new interests.",
  },
] as const;

function daysSince(d: Date | null | undefined, fallback: Date): number {
  const base = d || fallback;
  return Math.floor((Date.now() - base.getTime()) / 86400000);
}

/**
 * Send re-engagement for members inactive for 3 / 7 / 14 / 30 days.
 * Avoids re-sending the same day-bucket; steps up to the next bucket later.
 */
export async function runReengageRules(opts?: { take?: number }) {
  const take = opts?.take ?? 120;
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
  const byRule: Record<number, number> = { 3: 0, 7: 0, 14: 0, 30: 0 };

  for (const u of users) {
    if (sent >= take) break;

    const last = u.lastLoginAt || u.lastActiveAt || null;
    const idle = daysSince(last, u.createdAt);
    // Pick highest rule threshold they meet that we haven't already sent
    const rule = REENGAGE_RULES.find(
      (r) => idle >= r.day && (u.lastReengageDay == null || u.lastReengageDay < r.day)
    );
    if (!rule) {
      skipped++;
      continue;
    }

    // Throttle: at most one reengage email per 2 days
    if (
      u.lastReengageAt &&
      Date.now() - u.lastReengageAt.getTime() < 2 * 86400000
    ) {
      skipped++;
      continue;
    }

    const first = (u.name || "there").split(" ")[0];
    const city =
      u.aupairProfile?.city || u.familyProfile?.city || "your area";
    const href = "/discover";
    const url = `${site()}${href}`;

    await createNotification({
      userId: u.id,
      type: "SYSTEM",
      title: rule.title,
      body: rule.body,
      href,
    }).catch(() => null);

    if (u.email && u.emailPrefMessages !== "OFF") {
      void sendEmail({
        to: u.email,
        subject: rule.subject,
        text: `Hi ${first},\n\n${rule.body}\n\nCity focus: ${city}\n\nLog in: ${url}\n\nChange email prefs: ${site()}/settings/notifications\n`,
        html: `<p>Hi ${first},</p><p>${rule.body}</p><p style="margin:16px 0"><a href="${url}" style="display:inline-block;background:#0d9488;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Open AuPairly</a></p><p style="font-size:12px;color:#78716c">You're getting this because you haven't logged in for about ${rule.day} days. <a href="${site()}/settings/notifications">Email prefs</a></p>`,
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

  return { sent, skipped, byRule, scanned: users.length };
}
