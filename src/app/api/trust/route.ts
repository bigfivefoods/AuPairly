import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeSafetyScore } from "@/lib/safety";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const score = await recomputeSafetyScore(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      videoIntroUrl: true,
      placementVerified: true,
      safetyScore: true,
    },
  });
  const refs = await prisma.referenceRequest.count({
    where: { subjectId: session.user.id, status: "SUBMITTED" },
  });
  const verifications = await prisma.verification.findMany({
    where: { userId: session.user.id },
    select: { type: true, status: true },
  });

  return NextResponse.json({
    ...user,
    safetyScore: score,
    referenceCount: refs,
    verifications,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.videoIntroUrl != null) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { videoIntroUrl: String(body.videoIntroUrl) || null },
    });
  }

  const score = await recomputeSafetyScore(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { videoIntroUrl: true, placementVerified: true, safetyScore: true },
  });
  return NextResponse.json({ ok: true, ...user, safetyScore: score });
}
