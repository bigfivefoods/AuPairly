/**
 * Weekly match digest: top 3 compatibility matches per active user.
 */

import { prisma } from "@/lib/prisma";
import { computeCompatibility, type MatchProfile } from "@/lib/matching";
import { sendEmail } from "@/lib/email";

const site = () =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000";

export type DigestMatch = {
  userId: string;
  name: string;
  headline?: string | null;
  city?: string | null;
  country?: string | null;
  score: number;
  reasons: string[];
  href: string;
  type: "AUPAIR" | "FAMILY";
};

function profileFromAupair(p: {
  city: string | null;
  country: string | null;
  languages: string;
  liveIn: boolean;
  weeklyHours: number | null;
  availableFrom: Date | null;
  pocketMoneyMin: number | null;
  experienceYears: number;
  age: number | null;
}): MatchProfile {
  return {
    role: "AUPAIR",
    city: p.city,
    country: p.country,
    languages: p.languages,
    liveIn: p.liveIn,
    weeklyHours: p.weeklyHours,
    availableFrom: p.availableFrom,
    pocketMoneyMin: p.pocketMoneyMin,
    experienceYears: p.experienceYears,
    age: p.age,
  };
}

function profileFromFamily(p: {
  city: string | null;
  country: string | null;
  languages: string;
  liveIn: boolean;
  weeklyHours: number | null;
  startDate: Date | null;
  pocketMoney: number | null;
  childrenAges: string;
  childrenCount: number;
}): MatchProfile {
  return {
    role: "PARENT",
    city: p.city,
    country: p.country,
    languages: p.languages,
    liveIn: p.liveIn,
    weeklyHours: p.weeklyHours,
    startDate: p.startDate,
    pocketMoney: p.pocketMoney,
    childrenAges: p.childrenAges,
    childrenCount: p.childrenCount,
  };
}

/** Top N matches for one user (parent or au pair). */
export async function getTopMatchesForUser(
  userId: string,
  limit = 3
): Promise<DigestMatch[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { aupairProfile: true, familyProfile: true },
  });
  if (!user || (user.role !== "PARENT" && user.role !== "AUPAIR")) return [];

  const swiped = await prisma.swipe.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true },
  });
  const exclude = new Set(swiped.map((s) => s.toUserId));
  exclude.add(userId);

  if (user.role === "PARENT" && user.familyProfile) {
    const me = profileFromFamily(user.familyProfile);
    const profiles = await prisma.auPairProfile.findMany({
      where: {
        status: "ACTIVE",
        userId: { notIn: [...exclude] },
      },
      include: { user: { select: { id: true, name: true } } },
      take: 60,
    });
    return profiles
      .map((p) => {
        const compat = computeCompatibility(me, profileFromAupair(p));
        return {
          userId: p.userId,
          name: p.user.name,
          headline: p.headline,
          city: p.city,
          country: p.country,
          score: compat.score,
          reasons: compat.reasons,
          href: `/browse/aupairs/${p.id}`,
          type: "AUPAIR" as const,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  if (user.role === "AUPAIR" && user.aupairProfile) {
    const me = profileFromAupair(user.aupairProfile);
    const profiles = await prisma.familyProfile.findMany({
      where: {
        status: "ACTIVE",
        userId: { notIn: [...exclude] },
      },
      include: { user: { select: { id: true, name: true } } },
      take: 60,
    });
    return profiles
      .map((p) => {
        const compat = computeCompatibility(me, profileFromFamily(p));
        return {
          userId: p.userId,
          name: p.familyName || p.user.name,
          headline: p.headline,
          city: p.city,
          country: p.country,
          score: compat.score,
          reasons: compat.reasons,
          href: `/browse/families/${p.id}`,
          type: "FAMILY" as const,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  return [];
}

export async function sendMatchDigestEmail(opts: {
  toEmail: string;
  toName: string;
  matches: DigestMatch[];
}) {
  const first = opts.toName.split(" ")[0];
  if (opts.matches.length === 0) {
    return { skipped: true as const };
  }

  const base = site();
  const abs = (path: string) =>
    path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const lines = opts.matches
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} (${m.score}% match) — ${[m.city, m.country].filter(Boolean).join(", ") || "Location TBD"}\n   ${m.reasons[0] || ""}\n   ${abs(m.href)}`
    )
    .join("\n\n");

  const listHtml = opts.matches
    .map(
      (m) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e7e5e4">
          <div style="font-weight:600;color:#1c1917">${escape(m.name)} · ${m.score}% match</div>
          <div style="font-size:13px;color:#78716c;margin-top:4px">${escape([m.city, m.country].filter(Boolean).join(", ") || "Location TBD")}</div>
          <div style="font-size:13px;color:#0f766e;margin-top:4px">${escape(m.reasons[0] || "")}</div>
          <a href="${abs(m.href)}" style="display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:#0d9488">View profile →</a>
        </td>
      </tr>`
    )
    .join("");

  const discover = `${site()}/discover`;
  const text = `Hi ${first},\n\nHere are ${opts.matches.length} new matches picked for you this week:\n\n${lines}\n\nSwipe more on Discover: ${discover}\n\n— AuPairly`;

  return sendEmail({
    to: opts.toEmail,
    subject: `Your weekly AuPairly matches (${opts.matches.length} new)`,
    text,
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#faf8f5;padding:24px;color:#1c1917">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e7e5e4">
    <div style="font-size:20px;font-weight:700;margin-bottom:8px">Au<span style="color:#0d9488">Pairly</span></div>
    <h1 style="font-size:18px;margin:16px 0 8px">Hi ${escape(first)}, your weekly matches</h1>
    <p style="color:#57534e;font-size:14px;line-height:1.5">We picked profiles that fit your languages, location, and schedule.</p>
    <table style="width:100%;margin-top:8px;border-collapse:collapse">${listHtml}</table>
    <p style="margin-top:24px"><a href="${discover}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open Discover</a></p>
    <p style="margin-top:28px;font-size:12px;color:#78716c">You're receiving this because you have an AuPairly account with an active listing.</p>
  </div></body></html>`,
  });
}

/** Run digest for all users with active profiles. Returns stats. */
export async function runWeeklyMatchDigests(opts?: { limitUsers?: number }) {
  const limitUsers = opts?.limitUsers ?? 500;

  const parents = await prisma.user.findMany({
    where: {
      role: "PARENT",
      familyProfile: { status: "ACTIVE" },
    },
    select: { id: true, email: true, name: true },
    take: limitUsers,
  });
  const aupairs = await prisma.user.findMany({
    where: {
      role: "AUPAIR",
      aupairProfile: { status: "ACTIVE" },
    },
    select: { id: true, email: true, name: true },
    take: limitUsers,
  });

  const users = [...parents, ...aupairs];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const u of users) {
    try {
      const matches = await getTopMatchesForUser(u.id, 3);
      if (matches.length === 0) {
        skipped++;
        continue;
      }
      const result = await sendMatchDigestEmail({
        toEmail: u.email,
        toName: u.name,
        matches,
      });
      if ("skipped" in result && result.skipped) {
        skipped++;
      } else if ("delivered" in result) {
        if (result.delivered || result.provider === "console") sent++;
        else failed++;
      } else {
        failed++;
      }
    } catch (e) {
      console.error("[match-digest] user failed", u.id, e);
      failed++;
    }
  }

  return { users: users.length, sent, skipped, failed };
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
