import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { pendingReviewTargets, isReviewPublic } from "@/lib/reviews";
import { getPendingReviewsForUser } from "@/lib/pending-reviews";
import { PageHeader, Card, Avatar, Stars } from "@/components/ui";
import { ReviewSection } from "@/components/review-section";
import { format } from "date-fns";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ writeFor?: string; placement?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const writeFor = sp.writeFor?.trim() || "";

  const [pending, placementPending, received, given, writeTarget] =
    await Promise.all([
      pendingReviewTargets(user.id),
      getPendingReviewsForUser(user.id),
      prisma.review.findMany({
        where: { targetId: user.id },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.review.findMany({
        where: { authorId: user.id },
        include: {
          target: { select: { id: true, name: true, image: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      writeFor
        ? prisma.user.findUnique({
            where: { id: writeFor },
            select: { id: true, name: true, image: true, role: true },
          })
        : null,
    ]);

  const existingForWrite = writeFor
    ? await prisma.review.findUnique({
        where: {
          authorId_targetId: { authorId: user.id, targetId: writeFor },
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Trust"
        title="Mutual reviews"
        description="Like Airbnb: both parties rate each other. Reviews stay private until both are in — or after 14 days."
      />

      {writeTarget && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Review {writeTarget.name}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Your scores stay private until they review you too (or 14 days pass).
          </p>
          <div className="mt-4">
            <ReviewSection
              targetId={writeTarget.id}
              targetName={writeTarget.name}
              canReview={!existingForWrite}
              existing={existingForWrite}
              initialReviews={[]}
            />
          </div>
        </section>
      )}

      {placementPending.filter((p) => p.source === "placement").length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            After placement
          </h2>
          <ul className="mt-4 space-y-2">
            {placementPending
              .filter((p) => p.source === "placement")
              .map((p) => (
                <li
                  key={p.otherUserId}
                  className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2"
                >
                  <span className="text-sm font-semibold">{p.otherName}</span>
                  <Link href={p.href} className="text-sm font-semibold text-teal-700">
                    Write review →
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Waiting for your review
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            People you&apos;ve messaged. Leave a review so theirs can unlock too.
          </p>
          <ul className="mt-4 space-y-3">
            {pending.map((p) => {
              const profileId =
                p.role === "AUPAIR" ? p.aupairProfile?.id : p.familyProfile?.id;
              const href =
                p.role === "AUPAIR" && profileId
                  ? `/browse/aupairs/${profileId}`
                  : p.role === "PARENT" && profileId
                    ? `/browse/families/${profileId}`
                    : "/messages";
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} image={p.image} size="md" />
                    <div>
                      <p className="font-semibold text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">
                        {p.role === "AUPAIR"
                          ? p.aupairProfile?.headline
                          : p.familyProfile?.familyName || p.familyProfile?.headline}
                      </p>
                    </div>
                  </div>
                  <Link href={href} className="btn-primary text-sm !py-2 !px-4">
                    Rate
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-4 font-display text-lg font-semibold">Reviews about you</h2>
        {received.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-500">No reviews yet — complete placements and chats.</p>
          </Card>
        ) : (
          <ReviewSection
            targetId={user.id}
            targetName={user.name}
            canReview={false}
            initialReviews={received.map((r) => ({
              id: r.id,
              rating: isReviewPublic(r) ? r.rating : null,
              communication: isReviewPublic(r) ? r.communication : null,
              reliability: isReviewPublic(r) ? r.reliability : null,
              respect: isReviewPublic(r) ? r.respect : null,
              recommend: isReviewPublic(r) ? r.recommend : null,
              comment: isReviewPublic(r) ? r.comment : null,
              response: r.response,
              respondedAt: r.respondedAt?.toISOString() ?? null,
              publishedAt: r.publishedAt?.toISOString() ?? null,
              createdAt: r.createdAt.toISOString(),
              isPublic: isReviewPublic(r),
              isAuthor: false,
              isTarget: true,
              hiddenReason: !isReviewPublic(r) ? "AWAITING_MUTUAL" : null,
              author: r.author,
            }))}
          />
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Reviews you left</h2>
        {given.length === 0 ? (
          <Card>
            <p className="text-sm text-stone-500">You haven&apos;t left any reviews yet.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {given.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.target.name} image={r.target.image} size="sm" />
                    <div>
                      <p className="font-semibold">{r.target.name}</p>
                      <p className="text-xs text-stone-400">
                        {format(r.createdAt, "MMM d, yyyy")}
                        {!isReviewPublic(r) && " · waiting for them"}
                        {isReviewPublic(r) && " · public"}
                      </p>
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-stone-600">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
