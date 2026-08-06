import { prisma } from "@/lib/prisma";

/** Recompute target user's profile rating after a review change */
export async function recomputeUserRating(targetUserId: string) {
  const reviews = await prisma.review.findMany({
    where: { targetId: targetUserId },
    select: { rating: true },
  });

  const reviewCount = reviews.length;
  const rating =
    reviewCount === 0
      ? 0
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10;

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
