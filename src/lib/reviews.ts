import { prisma } from "@/lib/prisma";

/** Mutual reviews become public when both parties have reviewed OR after 14 days. */
export const REVIEW_REVEAL_DAYS = 14;

export function isReviewPublic(review: {
  publishedAt?: Date | null;
  createdAt: Date;
}): boolean {
  if (review.publishedAt) return true;
  const unlock = new Date(review.createdAt);
  unlock.setDate(unlock.getDate() + REVIEW_REVEAL_DAYS);
  return unlock <= new Date();
}

/**
 * After a review is saved, publish both sides if mutual, or publish this one if 14 days elapsed.
 * Mirrors Airbnb double-blind behaviour.
 */
export async function syncMutualPublish(authorId: string, targetId: string) {
  const [mine, theirs] = await Promise.all([
    prisma.review.findUnique({
      where: { authorId_targetId: { authorId, targetId } },
    }),
    prisma.review.findUnique({
      where: { authorId_targetId: { authorId: targetId, targetId: authorId } },
    }),
  ]);

  const now = new Date();

  if (mine && theirs) {
    // Both left reviews — publish both immediately
    await prisma.review.updateMany({
      where: {
        OR: [
          { id: mine.id },
          { id: theirs.id },
        ],
        publishedAt: null,
      },
      data: { publishedAt: now },
    });
    return { published: true, mutual: true as const };
  }

  // Time-based unlock for single-sided reviews past the window
  if (mine && !mine.publishedAt) {
    const unlock = new Date(mine.createdAt);
    unlock.setDate(unlock.getDate() + REVIEW_REVEAL_DAYS);
    if (unlock <= now) {
      await prisma.review.update({
        where: { id: mine.id },
        data: { publishedAt: now },
      });
      return { published: true, mutual: false as const };
    }
  }

  return { published: false, mutual: Boolean(theirs) };
}

/** Recompute target user's profile rating from *public* reviews only */
export async function recomputeUserRating(targetUserId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      targetId: targetUserId,
      OR: [
        { publishedAt: { not: null } },
        // Legacy / timed: treat old published via isReviewPublic in app layer —
        // for aggregates, only publishedAt counts after migration backfill
      ],
    },
    select: { rating: true, publishedAt: true, createdAt: true },
  });

  const publicReviews = reviews.filter((r) => isReviewPublic(r));
  const reviewCount = publicReviews.length;
  const rating =
    reviewCount === 0
      ? 0
      : Math.round(
          (publicReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10
        ) / 10;

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) return { rating, reviewCount };

  if (user.role === "AUPAIR") {
    await prisma.auPairProfile.updateMany({
      where: { userId: targetUserId },
      data: { rating, reviewCount },
    });
  } else if (user.role === "PARENT") {
    await prisma.familyProfile.updateMany({
      where: { userId: targetUserId },
      data: { rating, reviewCount },
    });
  }

  return { rating, reviewCount };
}

/** Users the current user can still review (messaged, not yet reviewed). */
export async function pendingReviewTargets(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      messages: { some: {} },
    },
    select: { userAId: true, userBId: true },
    take: 100,
  });

  const otherIds = [
    ...new Set(
      conversations.map((c) => (c.userAId === userId ? c.userBId : c.userAId))
    ),
  ];

  if (otherIds.length === 0) return [];

  const already = await prisma.review.findMany({
    where: { authorId: userId, targetId: { in: otherIds } },
    select: { targetId: true },
  });
  const done = new Set(already.map((r) => r.targetId));
  const pendingIds = otherIds.filter((id) => !done.has(id));

  if (pendingIds.length === 0) return [];

  // Also include placement partners (completed / placed)
  const users = await prisma.user.findMany({
    where: { id: { in: pendingIds } },
    select: {
      id: true,
      name: true,
      image: true,
      role: true,
      aupairProfile: { select: { id: true, headline: true } },
      familyProfile: { select: { id: true, familyName: true, headline: true } },
    },
  });

  return users;
}
