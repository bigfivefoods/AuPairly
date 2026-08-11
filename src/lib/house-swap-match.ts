/**
 * House-swap match scoring: date windows + destination / home city overlap.
 */

import { parseJsonArray } from "@/lib/utils";

export type SwapListing = {
  id: string;
  userId: string;
  familyName?: string | null;
  headline?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  swapAvailableFrom?: Date | string | null;
  swapAvailableTo?: Date | string | null;
  swapSeekingAreas?: string | null;
  swapHomeSummary?: string | null;
  swapSimultaneous?: boolean | null;
  coverImage?: string | null;
  photos?: string | null;
  userName?: string | null;
};

export type SwapMatch = {
  listing: SwapListing;
  score: number;
  reasons: string[];
};

function toDate(v?: Date | string | null): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Do two date ranges overlap? Open-ended ranges count as soft match. */
export function dateRangesOverlap(
  aFrom?: Date | string | null,
  aTo?: Date | string | null,
  bFrom?: Date | string | null,
  bTo?: Date | string | null
): boolean {
  const af = toDate(aFrom);
  const at = toDate(aTo);
  const bf = toDate(bFrom);
  const bt = toDate(bTo);
  if (!af && !at && !bf && !bt) return true; // both flexible
  if (!af && !at) return true;
  if (!bf && !bt) return true;
  const aStart = af?.getTime() ?? 0;
  const aEnd = at?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bStart = bf?.getTime() ?? 0;
  const bEnd = bt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return aStart <= bEnd && bStart <= aEnd;
}

function seekingList(raw?: string | null): string[] {
  return parseJsonArray(raw || "[]").map(norm).filter(Boolean);
}

/** Their home city matches one of my seeking areas (or reverse). */
function destinationFit(
  myCity: string | null | undefined,
  mySeeking: string[],
  theirCity: string | null | undefined,
  theirSeeking: string[]
): { score: number; reason?: string } {
  const myC = myCity ? norm(myCity) : "";
  const theirC = theirCity ? norm(theirCity) : "";

  if (theirC && mySeeking.some((s) => theirC.includes(s) || s.includes(theirC))) {
    return { score: 40, reason: `They are in a place you want (${theirCity})` };
  }
  if (myC && theirSeeking.some((s) => myC.includes(s) || s.includes(myC))) {
    return { score: 35, reason: `They want to visit your area (${myCity})` };
  }
  // Partial region/keyword overlap between seeking lists
  for (const a of mySeeking) {
    for (const b of theirSeeking) {
      if (a === b || a.includes(b) || b.includes(a)) {
        return { score: 15, reason: `Both open to ${a}` };
      }
    }
  }
  return { score: 0 };
}

export function scoreSwapMatch(me: SwapListing, them: SwapListing): SwapMatch {
  const reasons: string[] = [];
  let score = 0;

  // Dates (30)
  if (
    dateRangesOverlap(
      me.swapAvailableFrom,
      me.swapAvailableTo,
      them.swapAvailableFrom,
      them.swapAvailableTo
    )
  ) {
    score += 30;
    reasons.push("Date windows overlap (or flexible)");
  } else {
    score += 5;
  }

  // Destination (40)
  const dest = destinationFit(
    me.city,
    seekingList(me.swapSeekingAreas),
    them.city,
    seekingList(them.swapSeekingAreas)
  );
  score += dest.score;
  if (dest.reason) reasons.push(dest.reason);

  // Same country soft (10)
  if (
    me.country &&
    them.country &&
    norm(me.country) === norm(them.country)
  ) {
    score += 10;
    reasons.push(`Same country (${me.country})`);
  }

  // Simultaneous preference match (10)
  const mySim = me.swapSimultaneous !== false;
  const theirSim = them.swapSimultaneous !== false;
  if (mySim === theirSim) {
    score += 10;
    reasons.push(
      mySim ? "Both prefer simultaneous swap" : "Both open to non-simultaneous"
    );
  } else {
    score += 4;
  }

  // Both have home summary (10)
  if (me.swapHomeSummary && them.swapHomeSummary) {
    score += 10;
    reasons.push("Both described their homes");
  } else if (them.swapHomeSummary) {
    score += 5;
  }

  return {
    listing: them,
    score: Math.min(100, score),
    reasons,
  };
}

export function rankSwapMatches(
  me: SwapListing,
  others: SwapListing[],
  limit = 12
): SwapMatch[] {
  return others
    .filter((o) => o.id !== me.id && o.userId !== me.userId)
    .map((o) => scoreSwapMatch(me, o))
    .filter((m) => m.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
