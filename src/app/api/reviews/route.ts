import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeUserRating } from "@/lib/reviews";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("targetId");
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

  return NextResponse.json({ reviews });
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
    const body = schema.parse(await req.json());
    if (body.targetId === session.user.id) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: body.targetId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Must have messaged each other at least once
    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: session.user.id, userBId: body.targetId },
          { userAId: body.targetId, userBId: session.user.id },
        ],
      },
      include: { messages: { take: 1 } },
    });

    if (!conversation || conversation.messages.length === 0) {
      return NextResponse.json(
        { error: "You can only review people you've messaged on AuPairly." },
        { status: 403 }
      );
    }

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
        comment: body.comment?.trim() || null,
      },
      update: {
        rating: body.rating,
        comment: body.comment?.trim() || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    const stats = await recomputeUserRating(body.targetId);

    return NextResponse.json({ review, stats }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}
