/**
 * Safety / trust score (0–100) and placement-verified rules.
 */

import { prisma } from "@/lib/prisma";

export async function recomputeSafetyScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      verifications: true,
      aupairProfile: true,
      familyProfile: true,
      reviewsReceived: true,
      referencesAbout: { where: { status: "SUBMITTED" } },
    },
  });
  if (!user) return 50;

  let score = 40;

  const verifiedTypes = new Set(
    user.verifications.filter((v) => v.status === "VERIFIED").map((v) => v.type)
  );
  if (verifiedTypes.has("ID") || verifiedTypes.has("SELFIE")) score += 12;
  if (verifiedTypes.has("BACKGROUND") || verifiedTypes.has("REFERENCES")) score += 10;
  if (user.videoIntroUrl) score += 8;

  const refs = user.referencesAbout.length;
  score += Math.min(15, refs * 5);

  const profile = user.aupairProfile || user.familyProfile;
  if (profile?.isVerified) score += 10;
  if (profile?.bio && profile.bio.length > 80) score += 5;
  if (profile?.city && profile?.country) score += 3;

  const reviews = user.reviewsReceived;
  if (reviews.length > 0) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    score += Math.round((avg / 5) * 12);
  }

  const openReports = await prisma.report.count({
    where: { targetId: userId, status: "OPEN" },
  });
  score -= openReports * 15;

  score = Math.max(0, Math.min(100, score));

  const placementVerified =
    (verifiedTypes.has("ID") || verifiedTypes.has("SELFIE")) &&
    refs >= 2 &&
    Boolean(user.videoIntroUrl || profile?.isVerified);

  await prisma.user.update({
    where: { id: userId },
    data: { safetyScore: score, placementVerified },
  });

  return score;
}

export const PLACEMENT_STATUSES = [
  "INTERESTED",
  "INTERVIEW",
  "TRIAL",
  "PLACED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export const PLACEMENT_LABELS: Record<string, string> = {
  INTERESTED: "Interested",
  INTERVIEW: "Interview",
  TRIAL: "Trial week",
  PLACED: "Placed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function defaultContract(params: {
  parentName: string;
  aupairName: string;
  city?: string;
  pocketMoney?: string;
  weeklyHours?: string;
  startDate?: string;
}) {
  return `AUPAIRLY PLACEMENT AGREEMENT (template)

This informal agreement is between ${params.parentName} (Host Family) and ${params.aupairName} (Au Pair).

1. Location: ${params.city || "[city]"}
2. Start date: ${params.startDate || "[date]"}
3. Weekly hours: ${params.weeklyHours || "[hours]"} (cultural exchange / childcare as agreed)
4. Pocket money: ${params.pocketMoney || "[amount]"} per week
5. Accommodation: private room / as discussed
6. Notice period: 2 weeks written notice by either party
7. Both parties agree to AuPairly Community Guidelines and applicable local laws.

This template is not legal advice. Adapt for your jurisdiction (including South Africa labour / immigration rules). Sign only after independent review.

Host family: ________________  Date: ______
Au pair: _____________________  Date: ______
`;
}
