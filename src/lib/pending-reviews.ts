import { prisma } from "@/lib/prisma";
import { pendingReviewTargets } from "@/lib/reviews";

export type PendingReview = {
  placementId: string | null;
  otherUserId: string;
  otherName: string;
  otherImage: string | null;
  status: string;
  source: "placement" | "message";
  href: string;
};

/**
 * People this user should review: placement partners first, then messaged contacts.
 */
export async function getPendingReviewsForUser(
  userId: string
): Promise<PendingReview[]> {
  const pending: PendingReview[] = [];
  const seen = new Set<string>();

  const placements = await prisma.placement.findMany({
    where: {
      status: { in: ["PLACED", "COMPLETED", "TRIAL"] },
      OR: [{ parentUserId: userId }, { aupairUserId: userId }],
    },
    include: {
      parent: { select: { id: true, name: true, image: true } },
      aupair: { select: { id: true, name: true, image: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  for (const p of placements) {
    const other = p.parentUserId === userId ? p.aupair : p.parent;
    if (!other || seen.has(other.id)) continue;

    const existing = await prisma.review.findUnique({
      where: {
        authorId_targetId: {
          authorId: userId,
          targetId: other.id,
        },
      },
    });
    if (existing) continue;

    seen.add(other.id);
    pending.push({
      placementId: p.id,
      otherUserId: other.id,
      otherName: other.name,
      otherImage: other.image,
      status: p.status,
      source: "placement",
      href: `/reviews?writeFor=${other.id}&placement=${p.id}`,
    });
  }

  // Also surface messaged contacts awaiting review
  const messaged = await pendingReviewTargets(userId);
  for (const p of messaged) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const profileId =
      p.role === "AUPAIR" ? p.aupairProfile?.id : p.familyProfile?.id;
    const profileHref =
      p.role === "AUPAIR" && profileId
        ? `/browse/aupairs/${profileId}`
        : p.role === "PARENT" && profileId
          ? `/browse/families/${profileId}`
          : `/reviews?writeFor=${p.id}`;
    pending.push({
      placementId: null,
      otherUserId: p.id,
      otherName: p.name,
      otherImage: p.image,
      status: "MESSAGED",
      source: "message",
      href: `/reviews?writeFor=${p.id}`,
    });
    void profileHref;
  }

  return pending.slice(0, 12);
}
