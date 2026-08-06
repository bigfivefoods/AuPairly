import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCompatibility, type MatchProfile } from "@/lib/matching";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.shortlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      targetUser: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          safetyScore: true,
          avgResponseMinutes: true,
          placementVerified: true,
          videoIntroUrl: true,
          aupairProfile: true,
          familyProfile: true,
        },
      },
    },
  });

  const myA = await prisma.auPairProfile.findUnique({ where: { userId: session.user.id } });
  const myF = await prisma.familyProfile.findUnique({ where: { userId: session.user.id } });
  const meProfile: MatchProfile = myA
    ? {
        role: "AUPAIR",
        city: myA.city,
        country: myA.country,
        languages: myA.languages,
        liveIn: myA.liveIn,
        weeklyHours: myA.weeklyHours,
        availableFrom: myA.availableFrom,
        pocketMoneyMin: myA.pocketMoneyMin,
        experienceYears: myA.experienceYears,
      }
    : {
        role: "PARENT",
        city: myF?.city,
        country: myF?.country,
        languages: myF?.languages,
        liveIn: myF?.liveIn,
        weeklyHours: myF?.weeklyHours,
        startDate: myF?.startDate,
        pocketMoney: myF?.pocketMoney,
        childrenAges: myF?.childrenAges,
        childrenCount: myF?.childrenCount,
      };

  return NextResponse.json({
    items: items.map((it) => {
      const p = it.targetUser.aupairProfile || it.targetUser.familyProfile;
      const them: MatchProfile = it.targetUser.aupairProfile
        ? {
            role: "AUPAIR",
            city: it.targetUser.aupairProfile.city,
            country: it.targetUser.aupairProfile.country,
            languages: it.targetUser.aupairProfile.languages,
            liveIn: it.targetUser.aupairProfile.liveIn,
            weeklyHours: it.targetUser.aupairProfile.weeklyHours,
            availableFrom: it.targetUser.aupairProfile.availableFrom,
            pocketMoneyMin: it.targetUser.aupairProfile.pocketMoneyMin,
            experienceYears: it.targetUser.aupairProfile.experienceYears,
            age: it.targetUser.aupairProfile.age,
          }
        : {
            role: "PARENT",
            city: it.targetUser.familyProfile?.city,
            country: it.targetUser.familyProfile?.country,
            languages: it.targetUser.familyProfile?.languages,
            liveIn: it.targetUser.familyProfile?.liveIn,
            weeklyHours: it.targetUser.familyProfile?.weeklyHours,
            startDate: it.targetUser.familyProfile?.startDate,
            pocketMoney: it.targetUser.familyProfile?.pocketMoney,
            childrenAges: it.targetUser.familyProfile?.childrenAges,
            childrenCount: it.targetUser.familyProfile?.childrenCount,
          };
      const compat = computeCompatibility(meProfile, them);
      return {
        id: it.id,
        notes: it.notes,
        targetType: it.targetType,
        targetProfileId: it.targetProfileId,
        createdAt: it.createdAt,
        user: {
          id: it.targetUser.id,
          name: it.targetUser.name,
          image: it.targetUser.image,
          role: it.targetUser.role,
          safetyScore: it.targetUser.safetyScore,
          avgResponseMinutes: it.targetUser.avgResponseMinutes,
          placementVerified: it.targetUser.placementVerified,
          videoIntroUrl: it.targetUser.videoIntroUrl,
        },
        profile: p
          ? {
              headline: p.headline,
              city: p.city,
              country: p.country,
              languages: p.languages,
              liveIn: p.liveIn,
              weeklyHours: p.weeklyHours,
              isVerified: p.isVerified,
              rating: p.rating,
              ...(it.targetUser.aupairProfile
                ? {
                    experienceYears: it.targetUser.aupairProfile.experienceYears,
                    pocketMoneyMin: it.targetUser.aupairProfile.pocketMoneyMin,
                    age: it.targetUser.aupairProfile.age,
                    drivingLicense: it.targetUser.aupairProfile.drivingLicense,
                    firstAid: it.targetUser.aupairProfile.firstAid,
                    workRights: it.targetUser.aupairProfile.workRights,
                  }
                : {
                    childrenCount: it.targetUser.familyProfile?.childrenCount,
                    childrenAges: it.targetUser.familyProfile?.childrenAges,
                    pocketMoney: it.targetUser.familyProfile?.pocketMoney,
                    schoolArea: it.targetUser.familyProfile?.schoolArea,
                    drivingRequired: it.targetUser.familyProfile?.drivingRequired,
                  }),
            }
          : null,
        matchScore: compat.score,
        matchReasons: compat.reasons,
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const targetUserId = body.targetUserId as string;
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }
  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: "Cannot shortlist yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { aupairProfile: true, familyProfile: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const targetType = target.role === "AUPAIR" ? "AUPAIR" : "FAMILY";
  const targetProfileId = target.aupairProfile?.id || target.familyProfile?.id || null;

  const item = await prisma.shortlistItem.upsert({
    where: {
      userId_targetUserId: { userId: session.user.id, targetUserId },
    },
    create: {
      userId: session.user.id,
      targetUserId,
      targetType,
      targetProfileId,
      notes: body.notes || null,
    },
    update: {
      notes: body.notes !== undefined ? body.notes : undefined,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("targetUserId");
  const id = searchParams.get("id");

  if (id) {
    await prisma.shortlistItem.deleteMany({ where: { id, userId: session.user.id } });
  } else if (targetUserId) {
    await prisma.shortlistItem.deleteMany({
      where: { userId: session.user.id, targetUserId },
    });
  } else {
    return NextResponse.json({ error: "id or targetUserId required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
