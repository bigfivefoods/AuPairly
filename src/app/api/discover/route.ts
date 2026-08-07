import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndConsume, getUserPlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import { computeCompatibility, type MatchProfile } from "@/lib/matching";
import { marketplaceReady } from "@/lib/gates";
import { isServiceId, type ServiceId } from "@/lib/services";
import { profileIdsForService } from "@/lib/service-tags";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = session.user;
  const targetRole = me.role === "PARENT" ? "AUPAIR" : me.role === "AUPAIR" ? "PARENT" : null;
  if (!targetRole) {
    return NextResponse.json({ cards: [], message: "Discover is for hosts and sitters" });
  }

  const url = new URL(req.url);
  const serviceRaw = url.searchParams.get("service");
  const serviceFilter: ServiceId | null =
    serviceRaw && isServiceId(serviceRaw.toUpperCase().replace(/-/g, "_"))
      ? (serviceRaw.toUpperCase().replace(/-/g, "_") as ServiceId)
      : null;

  const meUser = await prisma.user.findUnique({
    where: { id: me.id },
    select: { image: true, videoIntroUrl: true, safetyScore: true },
  });
  const myAupair = await prisma.auPairProfile.findUnique({ where: { userId: me.id } });
  const myFamily = await prisma.familyProfile.findUnique({ where: { userId: me.id } });
  const profile = myAupair || myFamily;

  const gate = marketplaceReady({
    role: me.role,
    image: meUser?.image || me.image,
    headline: profile?.headline,
    bio: profile?.bio,
    city: profile?.city,
    country: profile?.country,
    status: profile?.status,
    services: profile?.services,
    isVerified: profile?.isVerified,
  });

  if (!gate.ok) {
    return NextResponse.json({
      cards: [],
      plan: (await getUserPlan(me.id)).plan.id,
      gate: {
        ok: false,
        percent: gate.percent,
        blockers: gate.blockers,
        reason: gate.reason,
      },
    });
  }

  const swiped = await prisma.swipe.findMany({
    where: { fromUserId: me.id },
    select: { toUserId: true },
  });
  const exclude = new Set(swiped.map((s) => s.toUserId));
  exclude.add(me.id);

  try {
    const { blockedUserIdsFor } = await import("@/lib/blocks");
    const blocked = await blockedUserIdsFor(me.id);
    for (const id of blocked) exclude.add(id);
  } catch {
    /* blocks table may not exist yet on first deploy */
  }

  const { plan } = await getUserPlan(me.id);
  const excludeIds = [...exclude];

  const meProfile: MatchProfile = myAupair
    ? {
        role: "AUPAIR",
        city: myAupair.city,
        country: myAupair.country,
        languages: myAupair.languages,
        liveIn: myAupair.liveIn,
        weeklyHours: myAupair.weeklyHours,
        availableFrom: myAupair.availableFrom,
        pocketMoneyMin: myAupair.pocketMoneyMin,
        experienceYears: myAupair.experienceYears,
        services: myAupair.services,
      }
    : {
        role: "PARENT",
        city: myFamily?.city,
        country: myFamily?.country,
        languages: myFamily?.languages,
        liveIn: myFamily?.liveIn,
        weeklyHours: myFamily?.weeklyHours,
        startDate: myFamily?.startDate,
        pocketMoney: myFamily?.pocketMoney,
        childrenAges: myFamily?.childrenAges,
        childrenCount: myFamily?.childrenCount,
        services: myFamily?.services,
      };

  // Prefer normalized tags; fall back to JSON contains
  let taggedIds: string[] | null = null;
  if (serviceFilter) {
    const roleTag = targetRole === "AUPAIR" ? "AUPAIR" : "FAMILY";
    taggedIds = await profileIdsForService(roleTag, serviceFilter);
  }

  if (targetRole === "AUPAIR") {
    const profiles = await prisma.auPairProfile.findMany({
      where: {
        status: "ACTIVE",
        ...(excludeIds.length ? { userId: { notIn: excludeIds } } : {}),
        ...(serviceFilter
          ? taggedIds && taggedIds.length > 0
            ? { OR: [{ id: { in: taggedIds } }, { services: { contains: serviceFilter } }] }
            : { services: { contains: serviceFilter } }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            placementVerified: true,
            safetyScore: true,
            videoIntroUrl: true,
            lastActiveAt: true,
          },
        },
      },
      take: 40,
    });

    const now = Date.now();
    const weekMs = 7 * 86400000;
    const enriched = profiles.map((p) => {
      const compat = computeCompatibility(meProfile, {
        role: "AUPAIR",
        city: p.city,
        country: p.country,
        languages: p.languages,
        liveIn: p.liveIn,
        weeklyHours: p.weeklyHours,
        availableFrom: p.availableFrom,
        pocketMoneyMin: p.pocketMoneyMin,
        experienceYears: p.experienceYears,
        age: p.age,
        services: p.services,
      });
      return { p, compat };
    });

    const myCity = (meProfile?.city || "").toLowerCase().trim();
    enriched.sort((a, b) => {
      const ab = a.p.boostedUntil && a.p.boostedUntil.getTime() > now ? 1 : 0;
      const bb = b.p.boostedUntil && b.p.boostedUntil.getTime() > now ? 1 : 0;
      if (bb !== ab) return bb - ab;
      if (a.p.isFeatured !== b.p.isFeatured) return a.p.isFeatured ? -1 : 1;
      // Same city / local first
      if (myCity) {
        const aLocal = (a.p.city || "").toLowerCase().includes(myCity) ? 1 : 0;
        const bLocal = (b.p.city || "").toLowerCase().includes(myCity) ? 1 : 0;
        if (bLocal !== aLocal) return bLocal - aLocal;
      }
      // Verified listings rank higher
      if (a.p.isVerified !== b.p.isVerified) return a.p.isVerified ? -1 : 1;
      // Active in last 7 days (login / message activity)
      const aActive =
        a.p.user.lastActiveAt && now - a.p.user.lastActiveAt.getTime() < weekMs
          ? 1
          : 0;
      const bActive =
        b.p.user.lastActiveAt && now - b.p.user.lastActiveAt.getTime() < weekMs
          ? 1
          : 0;
      if (bActive !== aActive) return bActive - aActive;
      if (b.compat.score !== a.compat.score) return b.compat.score - a.compat.score;
      // Recency: newer profiles slightly preferred when scores tie
      const aAge = a.p.createdAt?.getTime?.() ?? 0;
      const bAge = b.p.createdAt?.getTime?.() ?? 0;
      if (bAge !== aAge && Math.abs(bAge - aAge) > 86400000) return bAge - aAge;
      if (plan.limits.prioritySearch && a.p.rating !== b.p.rating) return b.p.rating - a.p.rating;
      return b.p.rating - a.p.rating;
    });

    return NextResponse.json({
      cards: enriched.slice(0, 20).map(({ p, compat }) => ({
        userId: p.userId,
        profileId: p.id,
        type: "AUPAIR" as const,
        name: p.user.name,
        image: p.user.image,
        headline: p.headline,
        bio: p.bio,
        city: p.city,
        country: p.country,
        nationality: p.nationality,
        languages: p.languages,
        age: p.age,
        isVerified: p.isVerified,
        isFeatured: p.isFeatured,
        experienceYears: p.experienceYears,
        rating: p.rating,
        services: p.services,
        placementVerified: p.user.placementVerified,
        safetyScore: p.user.safetyScore,
        matchScore: compat.score,
        matchReasons: compat.reasons,
      })),
      plan: plan.id,
      gate: { ok: true, percent: gate.percent },
      service: serviceFilter,
    });
  }

  const profiles = await prisma.familyProfile.findMany({
    where: {
      status: "ACTIVE",
      ...(excludeIds.length ? { userId: { notIn: excludeIds } } : {}),
      ...(serviceFilter
        ? taggedIds && taggedIds.length > 0
          ? { OR: [{ id: { in: taggedIds } }, { services: { contains: serviceFilter } }] }
          : { services: { contains: serviceFilter } }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          placementVerified: true,
          safetyScore: true,
          lastActiveAt: true,
        },
      },
    },
    take: 40,
  });

  const enriched = profiles.map((p) => {
    const compat = computeCompatibility(meProfile, {
      role: "PARENT",
      city: p.city,
      country: p.country,
      languages: p.languages,
      liveIn: p.liveIn,
      weeklyHours: p.weeklyHours,
      startDate: p.startDate,
      pocketMoney: p.pocketMoney,
      childrenAges: p.childrenAges,
      childrenCount: p.childrenCount,
      services: p.services,
    });
    return { p, compat };
  });

  const myCity = (meProfile?.city || "").toLowerCase().trim();
  const now = Date.now();
  const weekMs = 7 * 86400000;
  enriched.sort((a, b) => {
    const ab = a.p.boostedUntil && a.p.boostedUntil.getTime() > now ? 1 : 0;
    const bb = b.p.boostedUntil && b.p.boostedUntil.getTime() > now ? 1 : 0;
    if (bb !== ab) return bb - ab;
    if (a.p.isFeatured !== b.p.isFeatured) return a.p.isFeatured ? -1 : 1;
    if (myCity) {
      const aLocal = (a.p.city || "").toLowerCase().includes(myCity) ? 1 : 0;
      const bLocal = (b.p.city || "").toLowerCase().includes(myCity) ? 1 : 0;
      if (bLocal !== aLocal) return bLocal - aLocal;
    }
    if (a.p.isVerified !== b.p.isVerified) return a.p.isVerified ? -1 : 1;
    const aActive =
      a.p.user.lastActiveAt && now - a.p.user.lastActiveAt.getTime() < weekMs ? 1 : 0;
    const bActive =
      b.p.user.lastActiveAt && now - b.p.user.lastActiveAt.getTime() < weekMs ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    if (b.compat.score !== a.compat.score) return b.compat.score - a.compat.score;
    const aAge = a.p.createdAt?.getTime?.() ?? 0;
    const bAge = b.p.createdAt?.getTime?.() ?? 0;
    if (bAge !== aAge && Math.abs(bAge - aAge) > 86400000) return bAge - aAge;
    return b.p.rating - a.p.rating;
  });

  return NextResponse.json({
    cards: enriched.slice(0, 20).map(({ p, compat }) => ({
      userId: p.userId,
      profileId: p.id,
      type: "FAMILY" as const,
      name: p.familyName || p.user.name,
      image: p.user.image,
      headline: p.headline,
      bio: p.bio,
      city: p.city,
      country: p.country,
      childrenCount: p.childrenCount,
      childrenAges: p.childrenAges,
      isVerified: p.isVerified,
      isFeatured: p.isFeatured,
      pocketMoney: p.pocketMoney,
      rating: p.rating,
      services: p.services,
      placementVerified: p.user.placementVerified,
      safetyScore: p.user.safetyScore,
      matchScore: compat.score,
      matchReasons: compat.reasons,
    })),
    plan: plan.id,
    gate: { ok: true, percent: gate.percent },
    service: serviceFilter,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const toUserId = body.toUserId as string;
  const direction = (body.direction as string) || "LIKE";

  if (!toUserId || !["LIKE", "PASS", "SUPER"].includes(direction)) {
    return NextResponse.json({ error: "Invalid swipe" }, { status: 400 });
  }

  if (toUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const limit = await checkAndConsume(session.user.id, "SWIPE");
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: limit.reason,
        upgradeRequired: true,
        limit: limit.limit,
        used: limit.used,
      },
      { status: 402 }
    );
  }

  await prisma.swipe.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId: session.user.id,
        toUserId,
      },
    },
    create: {
      fromUserId: session.user.id,
      toUserId,
      direction,
    },
    update: { direction },
  });

  // Boost analytics: likes while target is boosted
  if (direction === "LIKE" || direction === "SUPER") {
    const now = new Date();
    await prisma.boostEvent.updateMany({
      where: { userId: toUserId, endsAt: { gt: now } },
      data: { likes: { increment: 1 } },
    });
    await prisma.auPairProfile.updateMany({
      where: { userId: toUserId, boostedUntil: { gt: now } },
      data: { boostLikes: { increment: 1 } },
    });
    await prisma.familyProfile.updateMany({
      where: { userId: toUserId, boostedUntil: { gt: now } },
      data: { boostLikes: { increment: 1 } },
    });
  }

  let matched = false;
  let conversationId: string | null = null;

  if (direction === "LIKE" || direction === "SUPER") {
    const reverse = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: session.user.id,
        },
      },
    });

    if (reverse && (reverse.direction === "LIKE" || reverse.direction === "SUPER")) {
      matched = true;
      await prisma.interest.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: session.user.id,
            toUserId,
          },
        },
        create: {
          fromUserId: session.user.id,
          toUserId,
          message: "We matched on Discover!",
          status: "ACCEPTED",
        },
        update: { status: "ACCEPTED" },
      });

      const [userAId, userBId] =
        session.user.id < toUserId
          ? [session.user.id, toUserId]
          : [toUserId, session.user.id];

      let conv = await prisma.conversation.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            userAId,
            userBId,
            messages: {
              create: {
                senderId: session.user.id,
                body: "It's a match! Looking forward to chatting about a possible placement.",
              },
            },
          },
        });
      }
      conversationId = conv.id;

      await createNotification({
        userId: toUserId,
        type: "MATCH",
        title: "It's a match!",
        body: `You and ${session.user.name} liked each other on Discover.`,
        href: `/messages/${conv.id}`,
      });
      await createNotification({
        userId: session.user.id,
        type: "MATCH",
        title: "It's a match!",
        body: "You both liked each other — start the conversation.",
        href: `/messages/${conv.id}`,
      });
    } else {
      await createNotification({
        userId: toUserId,
        type: "MATCH",
        title: "Someone liked you on Discover",
        body: "Upgrade to Plus to see who likes you — or keep swiping!",
        href: "/pricing",
        meta: { fromUserId: session.user.id, blurred: true },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    matched,
    conversationId,
    remaining: limit.remaining,
  });
}
