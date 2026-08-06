import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isReviewPublic,
  recomputeUserRating,
  syncMutualPublish,
  pendingReviewTargets,
} from "@/lib/reviews";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5).optional().nullable(),
  reliability: z.number().int().min(1).max(5).optional().nullable(),
  respect: z.number().int().min(1).max(5).optional().nullable(),
  recommend: z.boolean().optional(),
  comment: z.string().max(2000).optional().nullable(),
  privateNote: z.string().max(1000).optional().nullable(),
  context: z.enum(["MESSAGE", "PLACEMENT", "MATCH"]).optional(),
  placementId: z.string().optional().nullable(),
});

const responseSchema = z.object({
  reviewId: z.string().min(1),
  response: z.string().min(1).max(1000),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
  const mine = searchParams.get("mine") === "1";
  const session = await auth();

  // Review inbox for current user
  if (mine) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [received, given, pending] = await Promise.all([
      prisma.review.findMany({
        where: { targetId: session.user.id },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.review.findMany({
        where: { authorId: session.user.id },
        include: {
          target: { select: { id: true, name: true, image: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      pendingReviewTargets(session.user.id),
    ]);

    return NextResponse.json({
      received: received.map((r) => serializeReview(r, session.user!.id)),
      given: given.map((r) => ({
        ...serializeReview(r, session.user!.id),
        target: r.target,
      })),
      pending,
    });
  }

  if (!targetId) {
    return NextResponse.json({ error: "targetId required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { targetId },
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const viewerId = session?.user?.id;
  const visible = reviews
    .map((r) => serializeReview(r, viewerId))
    .filter((r) => r.isPublic || r.isAuthor || r.isTarget);

  return NextResponse.json({ reviews: visible });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`review:${session.user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many reviews" }, { status: 429 });
  }

  try {
    const raw = await req.json();

    // Public response path
    if (raw.response && raw.reviewId) {
      const data = responseSchema.parse(raw);
      const review = await prisma.review.findUnique({ where: { id: data.reviewId } });
      if (!review || review.targetId !== session.user.id) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }
      if (!isReviewPublic(review) && review.publishedAt == null) {
        // Allow response once public; if still hidden, still allow target to draft? Airbnb allows after publish.
      }
      const updated = await prisma.review.update({
        where: { id: data.reviewId },
        data: {
          response: data.response.trim(),
          respondedAt: new Date(),
        },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      });
      return NextResponse.json({
        review: serializeReview(updated, session.user.id),
      });
    }

    const body = schema.parse(raw);
    if (body.targetId === session.user.id) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: body.targetId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Must have messaged OR shared a placement
    const [conversation, placement] = await Promise.all([
      prisma.conversation.findFirst({
        where: {
          OR: [
            { userAId: session.user.id, userBId: body.targetId },
            { userAId: body.targetId, userBId: session.user.id },
          ],
        },
        include: { messages: { take: 1 } },
      }),
      prisma.placement.findFirst({
        where: {
          OR: [
            { parentUserId: session.user.id, aupairUserId: body.targetId },
            { parentUserId: body.targetId, aupairUserId: session.user.id },
          ],
          status: { in: ["PLACED", "COMPLETED", "TRIAL"] },
        },
      }),
    ]);

    const messaged = conversation && conversation.messages.length > 0;
    if (!messaged && !placement) {
      return NextResponse.json(
        {
          error:
            "You can only review people you've messaged or placed with on AuPairly.",
        },
        { status: 403 }
      );
    }

    const context =
      body.context || (placement ? "PLACEMENT" : "MESSAGE");

    const review = await prisma.review.upsert({
      where: {
        authorId_targetId: {
          authorId: session.user.id,
          targetId: body.targetId,
        },
      },
      create: {
        authorId: session.user.id,
        targetId: body.targetId,
        rating: body.rating,
        communication: body.communication ?? body.rating,
        reliability: body.reliability ?? body.rating,
        respect: body.respect ?? body.rating,
        recommend: body.recommend ?? true,
        comment: body.comment?.trim() || null,
        privateNote: body.privateNote?.trim() || null,
        context,
        placementId: body.placementId || placement?.id || null,
        // Not published until mutual or timer
        publishedAt: null,
      },
      update: {
        rating: body.rating,
        communication: body.communication ?? body.rating,
        reliability: body.reliability ?? body.rating,
        respect: body.respect ?? body.rating,
        recommend: body.recommend ?? true,
        comment: body.comment?.trim() || null,
        privateNote: body.privateNote?.trim() || null,
        context,
        placementId: body.placementId || placement?.id || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    const mutual = await syncMutualPublish(session.user.id, body.targetId);
    const refreshed = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    await recomputeUserRating(body.targetId);
    // If mutual publish, recompute author rating too (they received one)
    if (mutual.mutual) {
      await recomputeUserRating(session.user.id);
    }

    await createNotification({
      userId: body.targetId,
      type: "REVIEW",
      title: mutual.published
        ? "New public review"
        : "Someone left you a review",
      body: mutual.published
        ? `${session.user.name?.split(" ")[0] || "A member"} rated you ${body.rating}/5.`
        : "Leave your review so both become public — like Airbnb.",
      href: "/reviews",
    }).catch(() => null);

    return NextResponse.json(
      {
        review: serializeReview(refreshed!, session.user.id),
        mutual,
        message: mutual.published
          ? "Review published."
          : "Review saved. It becomes public when they review you, or after 14 days.",
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}

function serializeReview(
  r: {
    id: string;
    rating: number;
    communication?: number | null;
    reliability?: number | null;
    respect?: number | null;
    recommend?: boolean;
    comment: string | null;
    privateNote?: string | null;
    response?: string | null;
    respondedAt?: Date | null;
    publishedAt?: Date | null;
    createdAt: Date;
    context?: string;
    authorId: string;
    targetId: string;
    author?: { id: string; name: string; image?: string | null; role: string };
  },
  viewerId?: string
) {
  const public_ = isReviewPublic(r);
  const isAuthor = viewerId === r.authorId;
  const isTarget = viewerId === r.targetId;

  // Double-blind: hide content from target until public (author can always see own)
  const revealContent = public_ || isAuthor;

  return {
    id: r.id,
    rating: revealContent ? r.rating : null,
    communication: revealContent ? r.communication : null,
    reliability: revealContent ? r.reliability : null,
    respect: revealContent ? r.respect : null,
    recommend: revealContent ? r.recommend : null,
    comment: revealContent ? r.comment : null,
    // privateNote never to target
    privateNote: isAuthor ? r.privateNote : null,
    response: public_ || isTarget || isAuthor ? r.response : null,
    respondedAt: r.respondedAt?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    context: r.context,
    isPublic: public_,
    isAuthor,
    isTarget,
    author: r.author,
    // Hint for UI when hidden
    hiddenReason: !revealContent && isTarget ? "AWAITING_MUTUAL" : null,
  };
}
