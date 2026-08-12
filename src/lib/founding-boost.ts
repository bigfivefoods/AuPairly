/**
 * Founding / density launch boost: first publishers in a thin city get featured.
 * Server-only.
 */

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { DENSITY_TARGET_SIDE } from "@/lib/city-density-shared";

const FOUNDING_DAYS = 7;

/**
 * Call after a listing goes ACTIVE. If the city is still thin, grant featured.
 */
export async function maybeGrantFoundingBoost(opts: {
  userId: string;
  role: "AUPAIR" | "PARENT";
  city: string | null | undefined;
  profileId: string;
}) {
  const city = opts.city?.trim();
  if (!city) return { granted: false as const };

  try {
    const [sitters, hosts] = await Promise.all([
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
    ]);

    // Thin if either side below target (or total small)
    const thin =
      sitters < DENSITY_TARGET_SIDE ||
      hosts < DENSITY_TARGET_SIDE ||
      sitters + hosts <= DENSITY_TARGET_SIDE * 2;

    if (!thin) return { granted: false as const, sitters, hosts };

    const until = new Date();
    until.setDate(until.getDate() + FOUNDING_DAYS);

    if (opts.role === "AUPAIR") {
      await prisma.auPairProfile.update({
        where: { id: opts.profileId },
        data: { isFeatured: true, boostedUntil: until },
      });
    } else {
      await prisma.familyProfile.update({
        where: { id: opts.profileId },
        data: { isFeatured: true, boostedUntil: until },
      });
    }

    await prisma.boostEvent
      .create({
        data: {
          userId: opts.userId,
          startedAt: new Date(),
          endsAt: until,
        },
      })
      .catch(() => null);

    await createNotification({
      userId: opts.userId,
      type: "SYSTEM",
      title: `Founding ${opts.role === "AUPAIR" ? "sitter" : "host"} in ${city}`,
      body: `${city} is still growing — your listing is featured for ${FOUNDING_DAYS} days. Invite 3 people nearby to unlock better matches.`,
      href: "/invite",
    }).catch(() => null);

    return { granted: true as const, until, sitters, hosts };
  } catch (e) {
    console.error("[founding-boost]", e);
    return { granted: false as const };
  }
}
