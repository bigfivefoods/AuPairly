import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { peerProximity } from "@/lib/community";

/**
 * ACTIVE sitters open to peer connect, sorted by geo proximity to the viewer.
 * AUPAIR-only (hosts can still browse public listings elsewhere).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "AUPAIR" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "AuPair Connect is for sitter accounts" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const cityFilter = searchParams.get("city")?.trim() || "";
  const regionFilter = searchParams.get("region")?.trim() || "";
  const countryFilter = searchParams.get("country")?.trim() || "";
  const q = searchParams.get("q")?.trim() || "";
  const take = Math.min(Number(searchParams.get("limit") || 48) || 48, 60);

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      aupairProfile: {
        select: { city: true, region: true, country: true, continent: true },
      },
    },
  });

  const myLoc = me?.aupairProfile || {};

  const peers = await prisma.auPairProfile.findMany({
    where: {
      status: "ACTIVE",
      openToPeerConnect: true,
      userId: { not: session.user.id },
      ...(cityFilter
        ? {
            OR: [
              { city: { equals: cityFilter, mode: "insensitive" } },
              { city: { contains: cityFilter, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(regionFilter
        ? {
            OR: [
              { region: { equals: regionFilter, mode: "insensitive" } },
              { region: { contains: regionFilter, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(countryFilter
        ? {
            OR: [
              { country: { equals: countryFilter, mode: "insensitive" } },
              { country: { contains: countryFilter, mode: "insensitive" } },
            ],
          }
        : !cityFilter && !regionFilter && myLoc.country
          ? {
              // Default: prefer same country when no explicit filter
              OR: [
                { country: { equals: myLoc.country, mode: "insensitive" } },
                { country: { contains: myLoc.country, mode: "insensitive" } },
                ...(myLoc.city
                  ? [
                      {
                        city: {
                          equals: myLoc.city,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        city: {
                          contains: myLoc.city,
                          mode: "insensitive" as const,
                        },
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      ...(q
        ? {
            OR: [
              { headline: { contains: q, mode: "insensitive" } },
              { peerIntro: { contains: q, mode: "insensitive" } },
              { bio: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { user: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          safetyScore: true,
          lastActiveAt: true,
        },
      },
    },
    take: take * 2,
    orderBy: [{ isVerified: "desc" }, { updatedAt: "desc" }],
  });

  const rank: Record<string, number> = {
    city: 0,
    region: 1,
    country: 2,
    any: 3,
  };

  const items = peers
    .map((p) => {
      const proximity = peerProximity(myLoc, p);
      return {
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        image: p.user.image,
        headline: p.headline,
        peerIntro: p.peerIntro,
        city: p.city,
        region: p.region,
        country: p.country,
        continent: p.continent,
        nationality: p.nationality,
        languages: p.languages,
        age: p.age,
        experienceYears: p.experienceYears,
        isVerified: p.isVerified,
        rating: p.rating,
        reviewCount: p.reviewCount,
        safetyScore: p.user.safetyScore,
        proximity,
        lastActiveAt: p.user.lastActiveAt,
      };
    })
    .sort((a, b) => rank[a.proximity] - rank[b.proximity])
    .slice(0, take);

  return NextResponse.json({
    me: {
      city: myLoc.city || null,
      region: myLoc.region || null,
      country: myLoc.country || null,
    },
    items,
    total: items.length,
  });
}
