/**
 * Public pre-register teaser: how many sitters/hosts are in a city.
 * No auth — used on homepage + register.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { DENSITY_TARGET_SIDE } from "@/lib/city-density-shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = rateLimit(`city-preview:${clientIp(req)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const city = (url.searchParams.get("city") || "").trim().slice(0, 80);
  const role = (url.searchParams.get("role") || "PARENT").toUpperCase();

  if (city.length < 2) {
    return NextResponse.json({
      city: "",
      sitters: 0,
      hosts: 0,
      matchCount: 0,
      thin: true,
      samples: [] as string[],
      cta: "Enter your city to see who’s nearby.",
    });
  }

  try {
    const [sitters, hosts, sitterSamples, hostSamples] = await Promise.all([
      prisma.auPairProfile.count({
        where: {
          status: "ACTIVE",
          city: { contains: city, mode: "insensitive" },
        },
      }),
      prisma.familyProfile.count({
        where: {
          status: "ACTIVE",
          city: { contains: city, mode: "insensitive" },
        },
      }),
      prisma.auPairProfile.findMany({
        where: {
          status: "ACTIVE",
          city: { contains: city, mode: "insensitive" },
          headline: { not: null },
        },
        select: {
          headline: true,
          isVerified: true,
          user: { select: { name: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { isVerified: "desc" }],
        take: 3,
      }),
      prisma.familyProfile.findMany({
        where: {
          status: "ACTIVE",
          city: { contains: city, mode: "insensitive" },
          headline: { not: null },
        },
        select: {
          headline: true,
          familyName: true,
          isVerified: true,
          user: { select: { name: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { isVerified: "desc" }],
        take: 3,
      }),
    ]);

    const lookingForSitters = role === "PARENT";
    const matchCount = lookingForSitters ? sitters : hosts;
    const thin =
      sitters < DENSITY_TARGET_SIDE || hosts < DENSITY_TARGET_SIDE;

    const samples = lookingForSitters
      ? sitterSamples.map((s) => {
          const first = s.user.name?.split(" ")[0] || "Sitter";
          const h = (s.headline || "").slice(0, 60);
          return `${first}${s.isVerified ? " ✓" : ""}: ${h}`;
        })
      : hostSamples.map((h) => {
          const name =
            h.familyName || h.user.name?.split(" ")[0] || "Host family";
          const headline = (h.headline || "").slice(0, 60);
          return `${name}${h.isVerified ? " ✓" : ""}: ${headline}`;
        });

    let cta: string;
    if (matchCount === 0) {
      cta = lookingForSitters
        ? `Be among the first hosts in ${city} — list free and invite sitters nearby.`
        : `Be among the first sitters in ${city} — free profile, more visibility while supply is thin.`;
    } else if (thin) {
      cta = lookingForSitters
        ? `${sitters} sitter${sitters === 1 ? "" : "s"} nearby · city still growing — early hosts get more replies.`
        : `${hosts} host${hosts === 1 ? "" : "s"} hiring nearby · join free while ${city} is growing.`;
    } else {
      cta = lookingForSitters
        ? `${sitters} sitters ready in ${city}. Create a free host account to message.`
        : `${hosts} hosts looking in ${city}. Create a free sitter profile to apply.`;
    }

    return NextResponse.json({
      city,
      sitters,
      hosts,
      matchCount,
      thin,
      samples,
      cta,
      registerHref: lookingForSitters
        ? `/register?role=PARENT&city=${encodeURIComponent(city)}`
        : `/register?role=AUPAIR&city=${encodeURIComponent(city)}`,
      browseHref: lookingForSitters
        ? `/browse/aupairs?city=${encodeURIComponent(city)}`
        : `/browse/families?city=${encodeURIComponent(city)}`,
    });
  } catch (e) {
    console.error("[city-preview]", e);
    return NextResponse.json(
      { error: "Could not load city preview" },
      { status: 500 }
    );
  }
}
