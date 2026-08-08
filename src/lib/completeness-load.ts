/**
 * Server-only: load the same CompletenessInput the Dashboard uses
 * so Discover / boost / gates show the same %.
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import type { CompletenessInput } from "@/lib/completeness";
import { computeCompleteness } from "@/lib/completeness";
import { marketplaceReady } from "@/lib/gates";

export async function loadCompletenessInput(
  userId: string
): Promise<CompletenessInput | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      image: true,
      videoIntroUrl: true,
      safetyScore: true,
      aupairProfile: true,
      familyProfile: true,
    },
  });
  if (!user) return null;

  const [documentCount, referenceCount] = await Promise.all([
    prisma.secureDocument.count({ where: { userId } }),
    prisma.referenceRequest.count({
      where: { subjectId: userId, status: "SUBMITTED" },
    }),
  ]);

  const aupair = user.aupairProfile;
  const family = user.familyProfile;
  const profile = aupair || family;

  return {
    role: user.role,
    name: user.name,
    image: user.image,
    videoIntroUrl: user.videoIntroUrl,
    headline: profile?.headline,
    bio: profile?.bio,
    city: profile?.city,
    country: profile?.country,
    languages: profile?.languages,
    services: profile?.services,
    status: profile?.status,
    isVerified: Boolean(profile?.isVerified),
    photos: aupair?.photos || family?.photos,
    experienceYears: aupair?.experienceYears,
    pocketMoneyMin: aupair?.pocketMoneyMin,
    availableFrom: aupair?.availableFrom,
    workRights: aupair?.workRights,
    childrenCount: family?.childrenCount,
    childrenAges: family?.childrenAges,
    pocketMoney: family?.pocketMoney,
    startDate: family?.startDate,
    schoolArea: family?.schoolArea,
    lifestyleNotes: family?.lifestyleNotes,
    referenceCount,
    documentCount,
    safetyScore: user.safetyScore,
  };
}

/** Same completeness % as Dashboard coach */
export async function loadCompletenessPercent(userId: string) {
  const input = await loadCompletenessInput(userId);
  if (!input) return { percent: 0, input: null as CompletenessInput | null };
  const c = computeCompleteness(input);
  return { percent: c.percent, input, result: c };
}

/** Discover / boost gate using full profile input */
export async function loadMarketplaceGate(userId: string) {
  const input = await loadCompletenessInput(userId);
  if (!input) {
    return {
      ok: false as const,
      percent: 0,
      blockers: ["Sign in and complete your profile"],
      reason: "Complete your profile first.",
      input: null,
    };
  }
  const gate = marketplaceReady(input);
  return { ...gate, input };
}
