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
      videoIntroSeconds: true,
      videoIntroConfirmed: true,
      cvUrl: true,
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
    minVideoSeconds: 60,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const data: {
    videoIntroUrl?: string | null;
    videoIntroSeconds?: number | null;
    videoIntroConfirmed?: boolean;
    cvUrl?: string | null;
  } = {};

  if (body.videoIntroUrl != null) {
    data.videoIntroUrl = String(body.videoIntroUrl).trim() || null;
  }
  if (body.videoIntroSeconds != null) {
    const n = Number(body.videoIntroSeconds);
    data.videoIntroSeconds = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  if (body.videoIntroConfirmed != null) {
    data.videoIntroConfirmed = Boolean(body.videoIntroConfirmed);
  }
  if (body.cvUrl != null) {
    data.cvUrl = String(body.cvUrl).trim() || null;
  }

  if (Object.keys(data).length) {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
  }

  const score = await recomputeSafetyScore(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      videoIntroUrl: true,
      videoIntroSeconds: true,
      videoIntroConfirmed: true,
      cvUrl: true,
      placementVerified: true,
      safetyScore: true,
    },
  });
  return NextResponse.json({ ok: true, ...user, safetyScore: score });
}
