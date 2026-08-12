/**
 * Ops density targets for management growth (server-only).
 */

import { prisma } from "@/lib/prisma";
import { getGhostTownCities } from "@/lib/city-liquidity";
import { topCitiesByDensity } from "@/lib/city-density";
import {
  DENSITY_TARGET_SIDE,
  densityTargetsCsv,
  type CityTargetRow,
} from "@/lib/city-density-shared";

export { DENSITY_TARGET_SIDE, densityTargetsCsv };
export type { CityTargetRow };

export async function getDensityTargets(limit = 20): Promise<{
  targets: CityTargetRow[];
  healthyCount: number;
  thinCount: number;
  metrosReady: number;
}> {
  const [top, ghost] = await Promise.all([
    topCitiesByDensity(40),
    getGhostTownCities(25).catch(() => []),
  ]);

  const ghostHits = new Map(
    ghost.map((g) => [g.city.toLowerCase(), g.savedSearchHits || 0])
  );

  const map = new Map<string, { sitters: number; hosts: number }>();
  for (const t of top) {
    map.set(t.city, { sitters: t.sitters, hosts: t.hosts });
  }
  for (const g of ghost) {
    if (!map.has(g.city)) {
      map.set(g.city, { sitters: g.sitters, hosts: g.hosts });
    }
  }

  const targets: CityTargetRow[] = [...map.entries()]
    .map(([city, v]) => {
      const sittersGap = Math.max(0, DENSITY_TARGET_SIDE - v.sitters);
      const hostsGap = Math.max(0, DENSITY_TARGET_SIDE - v.hosts);
      const healthy =
        v.sitters >= DENSITY_TARGET_SIDE && v.hosts >= DENSITY_TARGET_SIDE;
      const hits = ghostHits.get(city.toLowerCase()) || 0;
      const score =
        sittersGap * 3 + hostsGap * 3 + hits * 5 + (healthy ? -20 : 0);
      return {
        city,
        sitters: v.sitters,
        hosts: v.hosts,
        total: v.sitters + v.hosts,
        sittersGap,
        hostsGap,
        healthy,
        score,
        savedSearchHits: hits || undefined,
      };
    })
    .sort((a, b) => b.score - a.score || a.total - b.total)
    .slice(0, limit);

  const healthyCount = targets.filter((t) => t.healthy).length;
  const thinCount = targets.filter((t) => !t.healthy).length;
  // Metros ready: cities that hit both sides (from full map)
  const metrosReady = [...map.values()].filter(
    (v) =>
      v.sitters >= DENSITY_TARGET_SIDE && v.hosts >= DENSITY_TARGET_SIDE
  ).length;

  return { targets, healthyCount, thinCount, metrosReady };
}

/** Public counter for landings: hosts + sitters in a city */
export async function publicCityCounts(city: string) {
  const c = city.trim();
  if (!c) return { sitters: 0, hosts: 0 };
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
  return { sitters, hosts };
}
