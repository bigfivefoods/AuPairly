/**
 * AuPairly commercial plans — freemium multi-service marketplace.
 * Primary currency: ZAR (Paystack).
 *
 * Tiers: Free · Plus · Premium
 * Paid periods (once-off access, no forced auto-renew):
 * - 2 weeks: low once-off on-ramp (period key WEEK for API compatibility)
 * - 3 months: hero pack (default) — billed once
 * - Annual: discount vs 4 × quarter packs
 *
 * Price ladder (2026 revise): short plan = discovery; Plus quarter = main ARPU;
 * Premium = visibility upsell, not a fake “best value” twin.
 */

/** Membership tier stored on user / subscription */
export type PlanId = "FREE" | "PLUS" | "PREMIUM";

/** Billing / access length for paid tiers */
export type BillingPeriod = "WEEK" | "QUARTER" | "ANNUAL";

export type PlanRole = "PARENT" | "AUPAIR" | "BOTH";

export type PlanLimits = {
  messagesPerDay: number; // -1 = unlimited
  interestsPerWeek: number;
  swipesPerDay: number;
  canSeeWhoLikedYou: boolean;
  featuredListing: boolean;
  boostsPerMonth: number;
  prioritySearch: boolean;
  readReceipts: boolean;
  partnerSeat: boolean;
};

export type PeriodPricing = {
  period: BillingPeriod;
  label: string;
  shortLabel: string;
  /** Amount charged at checkout (ZAR, full period) */
  priceZar: number;
  /** Headline number on the card */
  displayPrice: number;
  /** e.g. "once off" | "/mo" | "/year" */
  priceSuffix: string;
  billingNote: string;
  compareAtZar?: number;
  durationDays: number;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  bestValue?: boolean;
  /** Period options — empty for FREE */
  periods: PeriodPricing[];
};

export const BILLING_PERIODS: BillingPeriod[] = ["WEEK", "QUARTER", "ANNUAL"];

export const PERIOD_LABELS: Record<
  BillingPeriod,
  { label: string; shortLabel: string }
> = {
  WEEK: { label: "2 Weeks", shortLabel: "2 wks" },
  QUARTER: { label: "3 Months", shortLabel: "3 mo" },
  ANNUAL: { label: "Annual", shortLabel: "Year" },
};

/** Plus — R99 / 14 days on-ramp · R249 / 90 days hero · R799 / year */
const PLUS_PERIODS: PeriodPricing[] = [
  {
    period: "WEEK",
    label: "2 Weeks",
    shortLabel: "2 wks",
    priceZar: 99,
    displayPrice: 99,
    priceSuffix: "once off",
    billingNote: "14 days of Plus · R99 once · no auto-renew",
    durationDays: 14,
  },
  {
    period: "QUARTER",
    label: "3 Months",
    shortLabel: "3 mo",
    priceZar: 249,
    displayPrice: 83,
    priceSuffix: "/mo",
    billingNote: "R249 billed once for 3 months (≈ R83/mo) · no auto-renew",
    durationDays: 90,
  },
  {
    period: "ANNUAL",
    label: "Annual",
    shortLabel: "Year",
    priceZar: 799,
    displayPrice: 799,
    priceSuffix: "/year",
    billingNote: "R799 for 12 months · save R197 vs 4 × 3-month packs",
    compareAtZar: 996,
    durationDays: 365,
  },
];

/** Premium — visibility upsell for same periods */
const PREMIUM_PERIODS: PeriodPricing[] = [
  {
    period: "WEEK",
    label: "2 Weeks",
    shortLabel: "2 wks",
    priceZar: 179,
    displayPrice: 179,
    priceSuffix: "once off",
    billingNote: "14 days of Premium · R179 once · no auto-renew",
    durationDays: 14,
  },
  {
    period: "QUARTER",
    label: "3 Months",
    shortLabel: "3 mo",
    priceZar: 449,
    displayPrice: 150,
    priceSuffix: "/mo",
    billingNote: "R449 billed once for 3 months (≈ R150/mo) · no auto-renew",
    durationDays: 90,
  },
  {
    period: "ANNUAL",
    label: "Annual",
    shortLabel: "Year",
    priceZar: 1399,
    displayPrice: 1399,
    priceSuffix: "/year",
    billingNote: "R1399 for 12 months · save R397 vs 4 × 3-month packs",
    compareAtZar: 1796,
    durationDays: 365,
  },
];

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free",
    tagline: "Browse & try the marketplace",
    features: [
      "Create & publish a profile",
      "Browse verified listings",
      "5 messages per day",
      "5 interests per week",
      "25 Discover swipes per day",
      "AuPair Connect peer chat (free)",
    ],
    limits: {
      messagesPerDay: 5,
      interestsPerWeek: 5,
      swipesPerDay: 25,
      canSeeWhoLikedYou: false,
      featuredListing: false,
      boostsPerMonth: 0,
      prioritySearch: false,
      readReceipts: false,
      partnerSeat: false,
    },
    periods: [],
  },
  PLUS: {
    id: "PLUS",
    name: "Plus",
    tagline: "Unlimited matching — most popular",
    popular: true,
    features: [
      "Unlimited messages & interests",
      "Unlimited Discover swipes",
      "See who liked you",
      "Featured listing badge",
      "Read receipts",
      "2 profile boosts / month",
      "From R99 / 2 weeks · or R249 / 3 months",
    ],
    limits: {
      messagesPerDay: -1,
      interestsPerWeek: -1,
      swipesPerDay: -1,
      canSeeWhoLikedYou: true,
      featuredListing: true,
      boostsPerMonth: 2,
      prioritySearch: false,
      readReceipts: true,
      partnerSeat: false,
    },
    periods: PLUS_PERIODS,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    tagline: "Maximum visibility for serious hiring",
    bestValue: true,
    features: [
      "Everything in Plus",
      "Priority in search & Discover",
      "4 profile boosts / month",
      "Partner / co-parent seat",
      "Placement offer & hire kit tools",
      "Priority support",
      "Early access to new listings",
    ],
    limits: {
      messagesPerDay: -1,
      interestsPerWeek: -1,
      swipesPerDay: -1,
      canSeeWhoLikedYou: true,
      featuredListing: true,
      boostsPerMonth: 4,
      prioritySearch: true,
      readReceipts: true,
      partnerSeat: true,
    },
    periods: PREMIUM_PERIODS,
  },
};

export const TIER_ORDER: PlanId[] = ["FREE", "PLUS", "PREMIUM"];

export const PAID_PLAN_IDS: Exclude<PlanId, "FREE">[] = ["PLUS", "PREMIUM"];

export function isPaidPlanId(
  id?: string | null
): id is Exclude<PlanId, "FREE"> {
  return id === "PLUS" || id === "PREMIUM";
}

export function isBillingPeriod(v?: string | null): v is BillingPeriod {
  return v === "WEEK" || v === "QUARTER" || v === "ANNUAL";
}

/**
 * Normalise stored plan ids.
 * Legacy duration-only ids (WEEK/QUARTER/ANNUAL) map to PLUS.
 */
export function normalizePlanId(id?: string | null): PlanId {
  if (id === "FREE" || id === "PLUS" || id === "PREMIUM") return id;
  // Duration-only ids from previous pricing model → Plus
  if (id === "WEEK" || id === "QUARTER" || id === "ANNUAL") return "PLUS";
  return "FREE";
}

export function planFor(id?: string | null): PlanDefinition {
  return PLANS[normalizePlanId(id)];
}

export function getPeriodPricing(
  planId: PlanId | string | null | undefined,
  period: BillingPeriod | string | null | undefined
): PeriodPricing | null {
  const plan = planFor(planId);
  if (!plan.periods.length) return null;
  const p = isBillingPeriod(period) ? period : "QUARTER";
  return plan.periods.find((x) => x.period === p) ?? plan.periods[1] ?? plan.periods[0];
}

export function defaultPeriodFor(planId: PlanId): BillingPeriod | null {
  if (planId === "FREE") return null;
  return "QUARTER";
}

/** Headline display price for a tier + period */
export function priceFor(
  plan: PlanDefinition,
  period?: BillingPeriod | null
): number {
  if (plan.id === "FREE") return 0;
  const pp = getPeriodPricing(plan.id, period ?? "QUARTER");
  return pp?.displayPrice ?? 0;
}

/** Full checkout amount (ZAR) for tier + period */
export function chargePriceFor(
  plan: PlanDefinition,
  period?: BillingPeriod | null
): number {
  if (plan.id === "FREE") return 0;
  const pp = getPeriodPricing(plan.id, period ?? "QUARTER");
  return pp?.priceZar ?? 0;
}

/** Amount in cents for Paystack (ZAR). */
export function priceCentsFor(
  plan: PlanDefinition,
  period?: BillingPeriod | null
): number {
  return Math.round(chargePriceFor(plan, period) * 100);
}

export function durationDaysFor(
  planId: PlanId | string | null | undefined,
  period?: BillingPeriod | null
): number {
  const plan = planFor(planId);
  if (plan.id === "FREE") return 0;
  return getPeriodPricing(plan.id, period)?.durationDays ?? 30;
}

export function currencySymbol() {
  return "R";
}

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
