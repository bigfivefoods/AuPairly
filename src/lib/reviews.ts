import { prisma } from "@/lib/prisma";

/**
 * Reviews are owner-moderated before public release.
 * Authors always see their own; targets only see content after APPROVED + publishedAt.
 * App owners (management console) see all PENDING for release.
 */

export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export function isReviewPublic(review: {
  publishedAt?: Date | null;
  moderationStatus?: string | null;
  createdAt: Date;
}): boolean {
  const status = review.moderationStatus || "PENDING";
  if (status === "REJECTED") return false;
  // Legacy rows without moderationStatus field may only have publishedAt
  if (status === "APPROVED" && review.publishedAt) return true;
  // Back-compat: already-published before moderation launch
  if (!review.moderationStatus && review.publishedAt) return true;
  return false;
}

/**
 * After save: keep PENDING for owner review. Do not auto-publish.
 * (Mutual visibility for authors is handled in serialize — targets wait for release.)
 */
export async function syncMutualPublish(_authorId: string, _targetId: string) {
  return { published: false, mutual: false as const, moderated: true as const };
}

/** App owner releases a review to the public */
export async function approveReview(reviewId: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      moderationStatus: "APPROVED",
      moderatedAt: new Date(),
      publishedAt: new Date(),
    },
  });
  await recomputeUserRating(review.targetId);
  return review;
}

export async function rejectReview(reviewId: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      moderationStatus: "REJECTED",
      moderatedAt: new Date(),
      publishedAt: null,
    },
  });
  await recomputeUserRating(review.targetId);
  return review;
}

/** Recompute target user's profile rating from *public* reviews only */
export async function recomputeUserRating(targetUserId: string) {
  const reviews = await prisma.review.findMany({
    where: { targetId: targetUserId },
    select: {
      rating: true,
      publishedAt: true,
      createdAt: true,
      moderationStatus: true,
    },
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
