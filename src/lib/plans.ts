/**
 * AuPairly commercial plans — freemium multi-service marketplace
 * (childcare / au pairing, caregiving, house sitting, pet sitting).
 * Primary currency: ZAR (Paystack).
 *
 * Paid access is duration-based (same unlimited matching benefits):
 * - Week: R299 once-off
 * - 3 months: R99/mo (must buy 3 months → R297)
 * - Annual: R999 discounted (vs R99 × 12 = R1,188)
 */

export type PlanId = "FREE" | "WEEK" | "QUARTER" | "ANNUAL";

/** Legacy plan ids still stored on some users */
export type LegacyPlanId = "PLUS" | "PREMIUM";

export type PlanRole = "PARENT" | "AUPAIR" | "BOTH";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  /**
   * Amount charged at checkout in ZAR (once-off for the full period).
   * Same for parents and sitters.
   */
  priceZar: number;
  /**
   * Large number shown on the card (e.g. 99 for “R99/mo”, 299 for week).
   */
  displayPrice: number;
  /** Suffix next to display price: "once off" | "/mo" | "/year" */
  priceSuffix: string;
  /** Extra line under the price */
  billingNote?: string;
  /** Strikethrough compare-at (e.g. annual was R1,188) */
  compareAtZar?: number;
  /** Access length after successful payment */
  durationDays: number;
  features: string[];
  limits: {
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
  popular?: boolean;
  bestValue?: boolean;
};

/** Shared paid-tier limits (unlimited matching). */
const PAID_LIMITS_BASE = {
  messagesPerDay: -1,
  interestsPerWeek: -1,
  swipesPerDay: -1,
  canSeeWhoLikedYou: true,
  featuredListing: true,
  boostsPerMonth: 2,
  prioritySearch: true,
  readReceipts: true,
  partnerSeat: false,
} as const;

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Starter",
    tagline: "Browse & try the marketplace",
    priceZar: 0,
    displayPrice: 0,
    priceSuffix: "",
    durationDays: 0,
    features: [
      "Create & publish a profile",
      "Browse verified listings",
      "5 messages per day",
      "3 interests per week",
      "20 Discover swipes per day",
    ],
    limits: {
      messagesPerDay: 5,
      interestsPerWeek: 3,
      swipesPerDay: 20,
      canSeeWhoLikedYou: false,
      featuredListing: false,
      boostsPerMonth: 0,
      prioritySearch: false,
      readReceipts: false,
      partnerSeat: false,
    },
  },
  WEEK: {
    id: "WEEK",
    name: "1 Week",
    tagline: "Try unlimited matching for 7 days",
    priceZar: 299,
    displayPrice: 299,
    priceSuffix: "once off",
    billingNote: "7 days of full access · no auto-renew",
    durationDays: 7,
    features: [
      "Unlimited messages & interests",
      "Unlimited Discover swipes",
      "See who liked you",
      "Featured listing badge",
      "Read receipts",
      "Perfect for a short hiring burst",
    ],
    limits: {
      ...PAID_LIMITS_BASE,
      boostsPerMonth: 1,
      prioritySearch: false,
      partnerSeat: false,
    },
  },
  QUARTER: {
    id: "QUARTER",
    name: "3 Months",
    tagline: "R99/mo — buy 3 months minimum",
    priceZar: 297, // R99 × 3
    displayPrice: 99,
    priceSuffix: "/mo",
    billingNote: "R297 billed once for 3 months (R99 × 3)",
    durationDays: 90,
    popular: true,
    features: [
      "Unlimited messages & interests",
      "Unlimited Discover swipes",
      "See who liked you",
      "Featured listing badge",
      "Read receipts",
      "2 profile boosts / month",
      "Priority in search & Discover",
    ],
    limits: {
      ...PAID_LIMITS_BASE,
      boostsPerMonth: 2,
      prioritySearch: true,
      partnerSeat: false,
    },
  },
  ANNUAL: {
    id: "ANNUAL",
    name: "Annual",
    tagline: "Best value — full year discounted",
    priceZar: 999,
    displayPrice: 999,
    priceSuffix: "/year",
    billingNote: "Save R189 vs 12 × R99 (was R1,188)",
    compareAtZar: 1188,
    durationDays: 365,
    bestValue: true,
    features: [
      "Everything in 3 Months",
      "12 months of unlimited matching",
      "4 profile boosts / month",
      "Partner / co-parent seat",
      "Placement offer & hire kit tools",
      "Priority support",
      "Best price per month (~R83)",
    ],
    limits: {
      ...PAID_LIMITS_BASE,
      boostsPerMonth: 4,
      prioritySearch: true,
      partnerSeat: true,
    },
  },
};

/** Checkout / upgrade plan ids (excludes FREE). */
export const PAID_PLAN_IDS: Exclude<PlanId, "FREE">[] = [
  "WEEK",
  "QUARTER",
  "ANNUAL",
];

export function isPaidPlanId(
  id?: string | null
): id is Exclude<PlanId, "FREE"> {
  return id === "WEEK" || id === "QUARTER" || id === "ANNUAL";
}

/** Normalise stored plan ids (incl. legacy PLUS/PREMIUM). */
export function normalizePlanId(id?: string | null): PlanId {
  if (id === "WEEK" || id === "QUARTER" || id === "ANNUAL" || id === "FREE") {
    return id;
  }
  // Legacy mappings
  if (id === "PLUS") return "QUARTER";
  if (id === "PREMIUM") return "ANNUAL";
  return "FREE";
}

export function planFor(id?: string | null): PlanDefinition {
  return PLANS[normalizePlanId(id)];
}

/** Display amount (card headline) in ZAR. */
export function priceFor(plan: PlanDefinition, _role?: string) {
  return plan.displayPrice;
}

/** Amount charged at checkout in ZAR (full period). */
export function chargePriceFor(plan: PlanDefinition, _role?: string) {
  return plan.priceZar;
}

/** Amount in cents for Paystack (ZAR). */
export function priceCentsFor(plan: PlanDefinition, role?: string) {
  return Math.round(chargePriceFor(plan, role) * 100);
}

export function currencySymbol() {
  return "R";
}

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function weekKey(d = new Date()) {
  // ISO week key: YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
