import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankSwapMatches, type SwapListing } from "@/lib/house-swap-match";

/**
 * Rank other HOUSE_SWAP host listings against the current user's swap profile.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meProfile = await prisma.familyProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true } } },
  });

  if (!meProfile) {
    return NextResponse.json({
      matches: [],
      message:
        "House swap matching is for host families. Create a host listing and enable House swap.",
    });
  }

  const meServices = meProfile.services || "[]";
  if (!meServices.includes("HOUSE_SWAP")) {
    return NextResponse.json({
      matches: [],
      needsSwapService: true,
      message: "Add House swap under services on your host listing to get matches.",
    });
  }

  const others = await prisma.familyProfile.findMany({
    where: {
      status: "ACTIVE",
      userId: { not: session.user.id },
      services: { contains: "HOUSE_SWAP" },
    },
    include: { user: { select: { name: true } } },
    take: 80,
  });

  const me: SwapListing = {
    id: meProfile.id,
    userId: meProfile.userId,
    familyName: meProfile.familyName,
    headline: meProfile.headline,
    city: meProfile.city,
    region: meProfile.region,
    country: meProfile.country,
    swapAvailableFrom: meProfile.swapAvailableFrom,
    swapAvailableTo: meProfile.swapAvailableTo,
    swapSeekingAreas: meProfile.swapSeekingAreas,
    swapHomeSummary: meProfile.swapHomeSummary,
    swapSimultaneous: meProfile.swapSimultaneous,
    userName: meProfile.user.name,
  };

  const them: SwapListing[] = others.map((o) => ({
    id: o.id,
    userId: o.userId,
    familyName: o.familyName,
    headline: o.headline,
    city: o.city,
    region: o.region,
    country: o.country,
    swapAvailableFrom: o.swapAvailableFrom,
    swapAvailableTo: o.swapAvailableTo,
    swapSeekingAreas: o.swapSeekingAreas,
    swapHomeSummary: o.swapHomeSummary,
    swapSimultaneous: o.swapSimultaneous,
    coverImage: o.coverImage,
    photos: o.photos,
    userName: o.user.name,
  }));

  const matches = rankSwapMatches(me, them, 15).map((m) => ({
    score: m.score,
    reasons: m.reasons,
    profile: {
      id: m.listing.id,
      userId: m.listing.userId,
      name: m.listing.familyName || m.listing.userName || "Host family",
      headline: m.listing.headline,
      city: m.listing.city,
      region: m.listing.region,
      country: m.listing.country,
      swapAvailableFrom: m.listing.swapAvailableFrom,
      swapAvailableTo: m.listing.swapAvailableTo,
      swapSeekingAreas: m.listing.swapSeekingAreas,
      swapHomeSummary: m.listing.swapHomeSummary,
      swapSimultaneous: m.listing.swapSimultaneous,
      coverImage: m.listing.coverImage,
      href: `/browse/families/${m.listing.id}`,
    },
  }));

  return NextResponse.json({
    matches,
    me: {
      city: me.city,
      swapAvailableFrom: me.swapAvailableFrom,
      swapAvailableTo: me.swapAvailableTo,
      swapSeekingAreas: me.swapSeekingAreas,
    },
  });
}
