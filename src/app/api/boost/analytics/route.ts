import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.boostEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const aupair = await prisma.auPairProfile.findUnique({ where: { userId: session.user.id } });
  const family = await prisma.familyProfile.findUnique({ where: { userId: session.user.id } });
  const profile = aupair || family;

  const active = events.find((e) => e.endsAt.getTime() > Date.now());

  return NextResponse.json({
    events,
    active,
    totals: {
      boostViews: profile?.boostViews ?? 0,
      boostLikes: profile?.boostLikes ?? 0,
      boostedUntil: profile?.boostedUntil ?? null,
    },
  });
}
