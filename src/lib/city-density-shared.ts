/**
 * Client-safe density constants + CSV (no Prisma).
 */

/** Target supply per side for a “healthy” city */
export const DENSITY_TARGET_SIDE = 5;

export type CityTargetRow = {
  city: string;
  sitters: number;
  hosts: number;
  total: number;
  sittersGap: number;
  hostsGap: number;
  healthy: boolean;
  score: number;
  savedSearchHits?: number;
};

export function densityTargetsCsv(rows: CityTargetRow[]): string {
  const header =
    "city,sitters,hosts,total,sitters_gap,hosts_gap,healthy,saved_search_hits";
  const lines = rows.map((r) =>
    [
      csvEsc(r.city),
      r.sitters,
      r.hosts,
      r.total,
      r.sittersGap,
      r.hostsGap,
      r.healthy ? "yes" : "no",
      r.savedSearchHits ?? 0,
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

function csvEsc(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
