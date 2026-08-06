/**
 * AuPairly commercial plans — freemium marketplace.
 * Primary currency for SA: ZAR (Paystack). USD fields kept for display reference.
 */

export type PlanId = "FREE" | "PLUS" | "PREMIUM";
export type PlanRole = "PARENT" | "AUPAIR" | "BOTH";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Reference USD (legacy / international) */
  priceParentMonthly: number;
  priceAupairMonthly: number;
  /** South Africa ZAR monthly prices (Paystack) */
  priceParentMonthlyZar: number;
  priceAupairMonthlyZar: number;
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
  };
  /** Optional Paystack Plan codes if you create recurring plans in the dashboard */
  paystackPlanEnvParent?: string;
  paystackPlanEnvAupair?: string;
  popular?: boolean;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Starter",
    tagline: "Browse & try the marketplace",
    priceParentMonthly: 0,
    priceAupairMonthly: 0,
    priceParentMonthlyZar: 0,
    priceAupairMonthlyZar: 0,
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
    },
  },
  PLUS: {
    id: "PLUS",
    name: "Plus",
    tagline: "Unlimited matching — most popular",
    priceParentMonthly: 29,
    priceAupairMonthly: 14,
    priceParentMonthlyZar: 69,
    priceAupairMonthlyZar: 69,
    popular: true,
    features: [
      "Unlimited messages",
      "Unlimited interests",
      "Unlimited Discover swipes",
      "See who liked you",
      "Featured listing badge",
      "Read receipts",
      "1 profile boost / month",
    ],
    limits: {
      messagesPerDay: -1,
      interestsPerWeek: -1,
      swipesPerDay: -1,
      canSeeWhoLikedYou: true,
      featuredListing: true,
      boostsPerMonth: 1,
      prioritySearch: false,
      readReceipts: true,
    },
    paystackPlanEnvParent: "PAYSTACK_PLAN_PLUS_PARENT",
    paystackPlanEnvAupair: "PAYSTACK_PLAN_PLUS_AUPAIR",
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    tagline: "Maximum visibility & priority",
    priceParentMonthly: 59,
    priceAupairMonthly: 29,
    priceParentMonthlyZar: 169,
    priceAupairMonthlyZar: 169,
    features: [
      "Everything in Plus",
      "Priority in search & Discover",
      "4 profile boosts / month",
      "Early access to new listings",
      "Priority support",
      "Placement checklist tools",
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
    },
    paystackPlanEnvParent: "PAYSTACK_PLAN_PREMIUM_PARENT",
    paystackPlanEnvAupair: "PAYSTACK_PLAN_PREMIUM_AUPAIR",
  },
};

export function planFor(id?: string | null): PlanDefinition {
  if (id === "PLUS" || id === "PREMIUM") return PLANS[id];
  return PLANS.FREE;
}

/** Display / charge price in ZAR (primary for SA Paystack). */
export function priceFor(plan: PlanDefinition, role: string) {
  return role === "AUPAIR" ? plan.priceAupairMonthlyZar : plan.priceParentMonthlyZar;
}

/** Amount in cents for Paystack (ZAR). */
export function priceCentsFor(plan: PlanDefinition, role: string) {
  return Math.round(priceFor(plan, role) * 100);
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
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
