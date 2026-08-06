/**
 * Server-only safety / trust score helpers.
 * Client Components must import from placement-constants instead.
 */

import { prisma } from "@/lib/prisma";

export {
  PLACEMENT_STATUSES,
  PLACEMENT_LABELS,
  defaultContract,
  type PlacementStatus,
} from "@/lib/placement-constants";

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
