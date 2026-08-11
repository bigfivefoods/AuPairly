/**
 * City marketplace density — sitters & hosts per city for empty states & growth.
 */

import { prisma } from "@/lib/prisma";

export type CityDensity = {
  city: string;
  sitters: number;
  hosts: number;
  total: number;
  thin: boolean;
  /** Suggested copy for empty / thin markets */
  emptyHint: string;
};

export async function getCityDensity(city?: string | null): Promise<CityDensity | null> {
  const c = city?.trim();
  if (!c) return null;

  const [sitters, hosts] = await Promise.all([
    prisma.auPairProfile.count({
      where: {
        status: "ACTIVE",
        city: { contains: c, mode: "insensitive" },
      },
    }),
    prisma.familyProfile.count({
      where: {
        status: "ACTIVE",
        city: { contains: c, mode: "insensitive" },
      },
    }),
  ]);

  const total = sitters + hosts;
  const thin = total < 5;
  const emptyHint =
    total === 0
      ? `Be first in ${c} — list free, then invite 3 people nearby.`
      : thin
        ? `${c} is still growing (${sitters} sitters · ${hosts} hosts). Invite friends to unlock better matches.`
        : `${c}: ${sitters} sitters · ${hosts} hosts on AuPairly.`;

  return { city: c, sitters, hosts, total, thin, emptyHint };
}

/** Top cities by active listings (for density strip / admin growth) */
export async function topCitiesByDensity(limit = 12): Promise<
  { city: string; sitters: number; hosts: number; total: number }[]
> {
  const [sitters, hosts] = await Promise.all([
    prisma.auPairProfile.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
      _count: { id: true },
    }),
    prisma.familyProfile.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
      _count: { id: true },
    }),
  ]);

  const map = new Map<string, { sitters: number; hosts: number }>();
  for (const s of sitters) {
    if (!s.city) continue;
    const key = s.city.trim();
    const cur = map.get(key) || { sitters: 0, hosts: 0 };
    cur.sitters += s._count.id;
    map.set(key, cur);
  }
  for (const h of hosts) {
    if (!h.city) continue;
    const key = h.city.trim();
    const cur = map.get(key) || { sitters: 0, hosts: 0 };
    cur.hosts += h._count.id;
    map.set(key, cur);
  }

  return [...map.entries()]
    .map(([city, v]) => ({
      city,
      sitters: v.sitters,
      hosts: v.hosts,
      total: v.sitters + v.hosts,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
