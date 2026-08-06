import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeSafetyScore } from "@/lib/safety";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const ref = await prisma.referenceRequest.findUnique({ where: { token } });
  if (!ref) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  const subject = await prisma.user.findUnique({
    where: { id: ref.subjectId },
    select: { name: true },
  });
  return NextResponse.json({
    status: ref.status,
    subjectName: subject?.name,
    refereeName: ref.refereeName,
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const ref = await prisma.referenceRequest.findUnique({ where: { token } });
  if (!ref) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (ref.status === "SUBMITTED") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const body = await req.json();
  const rating = Number(body.rating);
  const comment = String(body.comment || "").trim();
  const relationship = body.relationship ? String(body.relationship) : null;
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating 1–5 required" }, { status: 400 });
  }

  await prisma.referenceRequest.update({
    where: { id: ref.id },
    data: {
      status: "SUBMITTED",
      rating,
      comment,
      relationship,
      submittedAt: new Date(),
      refereeName: body.refereeName ? String(body.refereeName) : ref.refereeName,
    },
  });

  await recomputeSafetyScore(ref.subjectId);
  await createNotification({
    userId: ref.subjectId,
    type: "REVIEW",
    title: "New reference received",
    body: "Someone submitted a reference for you.",
    href: "/trust",
  });

  return NextResponse.json({ ok: true });
}
