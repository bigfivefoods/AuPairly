/**
 * Compatibility scoring for Discover & browse.
 * Returns 0–100 plus human-readable reasons.
 */

import { parseJsonArray } from "@/lib/utils";

export type MatchProfile = {
  role: "AUPAIR" | "PARENT";
  city?: string | null;
  country?: string | null;
  languages?: string | null;
  liveIn?: boolean | null;
  weeklyHours?: number | null;
  // Au pair
  availableFrom?: Date | string | null;
  pocketMoneyMin?: number | null;
  experienceYears?: number | null;
  age?: number | null;
  // Family
  startDate?: Date | string | null;
  pocketMoney?: number | null;
  childrenAges?: string | null;
  childrenCount?: number | null;
};

export type CompatibilityResult = {
  score: number;
  reasons: string[];
};

function toDate(v?: Date | string | null): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeCompatibility(
  me: MatchProfile,
  them: MatchProfile
): CompatibilityResult {
  const reasons: string[] = [];
  let points = 0;
  let max = 0;

  // Location (25)
  max += 25;
  if (me.city && them.city && me.city.toLowerCase() === them.city.toLowerCase()) {
    points += 25;
    reasons.push(`Both in ${me.city}`);
  } else if (
    me.country &&
    them.country &&
    me.country.toLowerCase() === them.country.toLowerCase()
  ) {
    points += 15;
    reasons.push(`Same country (${me.country})`);
  } else if (me.country || them.country) {
    points += 5;
  }

  // Languages (20)
  max += 20;
  const myLangs = new Set(parseJsonArray(me.languages).map((l) => l.toLowerCase()));
  const theirLangs = parseJsonArray(them.languages).map((l) => l.toLowerCase());
  const shared = theirLangs.filter((l) => myLangs.has(l));
  if (shared.length > 0) {
    points += Math.min(20, 10 + shared.length * 5);
    reasons.push(`Shared languages: ${shared.slice(0, 3).join(", ")}`);
  }

  // Live-in preference (15)
  max += 15;
  if (me.liveIn != null && them.liveIn != null) {
    if (me.liveIn === them.liveIn) {
      points += 15;
      reasons.push(me.liveIn ? "Both prefer live-in" : "Both prefer live-out");
    } else {
      points += 4;
    }
  } else {
    points += 8;
  }

  // Schedule / hours (15)
  max += 15;
  if (me.weeklyHours && them.weeklyHours) {
    const diff = Math.abs(me.weeklyHours - them.weeklyHours);
    if (diff <= 5) {
      points += 15;
      reasons.push("Similar weekly hours");
    } else if (diff <= 15) {
      points += 10;
    } else {
      points += 4;
    }
  } else {
    points += 7;
  }

  // Dates availability (15)
  max += 15;
  const myStart =
    toDate(me.role === "AUPAIR" ? me.availableFrom : me.startDate) ||
    toDate(me.startDate) ||
    toDate(me.availableFrom);
  const theirStart =
    toDate(them.role === "AUPAIR" ? them.availableFrom : them.startDate) ||
    toDate(them.startDate) ||
    toDate(them.availableFrom);
  if (myStart && theirStart) {
    const days = Math.abs(myStart.getTime() - theirStart.getTime()) / 86400000;
    if (days <= 30) {
      points += 15;
      reasons.push("Start dates within a month");
    } else if (days <= 90) {
      points += 10;
      reasons.push("Start dates roughly aligned");
    } else {
      points += 3;
    }
  } else {
    points += 7;
  }

  // Budget / pocket money (10)
  max += 10;
  const familyBudget =
    me.role === "PARENT" ? me.pocketMoney : them.role === "PARENT" ? them.pocketMoney : null;
  const aupairMin =
    me.role === "AUPAIR" ? me.pocketMoneyMin : them.role === "AUPAIR" ? them.pocketMoneyMin : null;
  if (familyBudget != null && aupairMin != null) {
    if (familyBudget >= aupairMin) {
      points += 10;
      reasons.push("Pocket money fits budget");
    } else if (familyBudget >= aupairMin * 0.85) {
      points += 6;
      reasons.push("Budget close to expectation");
    } else {
      points += 2;
    }
  } else {
    points += 5;
  }

  const score = Math.max(0, Math.min(100, Math.round((points / max) * 100)));
  if (reasons.length === 0) reasons.push("Complete both profiles for a richer score");
  return { score, reasons: reasons.slice(0, 4) };
}
