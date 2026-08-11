import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessManagement } from "@/lib/management";
import { approveReview, rejectReview } from "@/lib/reviews";
import { createNotification } from "@/lib/notifications";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canAccessManagement(session.user)) return null;
  return session.user;
}

/** List reviews awaiting owner moderation */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pending = await prisma.review.findMany({
    where: { moderationStatus: "PENDING" },
    include: {
      author: { select: { id: true, name: true, email: true, role: true, image: true } },
      target: { select: { id: true, name: true, email: true, role: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({
    reviews: pending.map((r) => ({
      id: r.id,
      rating: r.rating,
      communication: r.communication,
      reliability: r.reliability,
      respect: r.respect,
      recommend: r.recommend,
      comment: r.comment,
      privateNote: r.privateNote,
      context: r.context,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
      target: r.target,
    })),
  });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = body.id as string;
  const action = body.action as "approve" | "reject";
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    const review = await approveReview(id);
    await createNotification({
      userId: existing.targetId,
      type: "REVIEW",
      title: "New public review",
      body: `A ${existing.rating}★ review about you was released on AuPairly.`,
      href: "/reviews",
    }).catch(() => null);
    await createNotification({
      userId: existing.authorId,
      type: "REVIEW",
      title: "Your review was published",
      body: "Thanks — your rating is now visible on their profile.",
      href: "/reviews",
    }).catch(() => null);
    return NextResponse.json({ ok: true, review });
  }

  const review = await rejectReview(id);
  await createNotification({
    userId: existing.authorId,
    type: "REVIEW",
    title: "Review not published",
    body: "Your review did not pass moderation. You can edit and resubmit from Reviews.",
    href: "/reviews",
  }).catch(() => null);
  return NextResponse.json({ ok: true, review });
}
