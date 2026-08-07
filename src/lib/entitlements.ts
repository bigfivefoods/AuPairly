import { prisma } from "@/lib/prisma";
import {
  dayKey,
  isPaidPlanId,
  normalizePlanId,
  planFor,
  weekKey,
  type PlanDefinition,
  type PlanId,
} from "@/lib/plans";
import { createNotification } from "@/lib/notifications";

/**
 * Demote a user to Free after paid period ends.
 * Keeps the account; only plan / paid listing benefits are cleared.
 */
export async function demoteUserToFreePlan(
  userId: string,
  opts?: { notify?: boolean; reason?: string }
): Promise<{ demoted: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      plan: true,
      role: true,
      aupairProfile: { select: { boostedUntil: true } },
      familyProfile: { select: { boostedUntil: true } },
      subscription: true,
    },
  });
  if (!user) return { demoted: false };

  const wasPaid =
    isPaidPlanId(normalizePlanId(user.plan)) ||
    (user.subscription?.status === "ACTIVE" &&
      isPaidPlanId(normalizePlanId(user.subscription.plan)));

  await prisma.user.update({
    where: { id: userId },
    data: { plan: "FREE" },
  });

  if (user.subscription) {
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        plan: "FREE",
        status: "EXPIRED",
        cancelAtPeriodEnd: false,
      },
    });
  }

  // Drop plan-based featured status unless a paid/temporary boost is still active
  const now = new Date();
  const boostedUntil =
    user.role === "AUPAIR"
      ? user.aupairProfile?.boostedUntil
      : user.familyProfile?.boostedUntil;
  const boostActive = Boolean(boostedUntil && boostedUntil > now);

  if (!boostActive) {
    if (user.role === "AUPAIR") {
      await prisma.auPairProfile.updateMany({
        where: { userId },
        data: { isFeatured: false },
      });
    } else if (user.role === "PARENT") {
      await prisma.familyProfile.updateMany({
        where: { userId },
        data: { isFeatured: false },
      });
    }
  }

  if (wasPaid && opts?.notify !== false) {
    await createNotification({
      userId,
      type: "BILLING",
      title: "You're back on Free",
      body:
        opts?.reason ||
        "Your Plus/Premium period ended. Your account stays active on the Free plan — upgrade anytime to unlock unlimited matching.",
      href: "/pricing",
    }).catch(() => null);
  }

  return { demoted: wasPaid };
}

/** True when a paid subscription window is still valid. */
export function isSubscriptionPeriodActive(
  sub: { status: string; currentPeriodEnd: Date | null; plan: string } | null | undefined,
  now = new Date()
): boolean {
  if (!sub) return false;
  if (sub.status !== "ACTIVE") return false;
  if (!isPaidPlanId(normalizePlanId(sub.plan))) return false;
  // Missing end date = treat as expired (force explicit period from checkout)
  if (!sub.currentPeriodEnd) return false;
  return sub.currentPeriodEnd > now;
}

export async function getUserPlan(userId: string): Promise<{
  planId: PlanId;
  plan: PlanDefinition;
  subscription: Awaited<ReturnType<typeof prisma.subscription.findUnique>>;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscription: true },
  });

  let planId = normalizePlanId(user?.plan || "FREE");
  let sub = user?.subscription ?? null;
  const now = new Date();

  // Active paid window still running → use subscription plan
  if (isSubscriptionPeriodActive(sub, now)) {
    planId = normalizePlanId(sub!.plan);
    return { planId, plan: planFor(planId), subscription: sub };
  }

  // Period ended (or paid flag stuck on user without a valid sub) → demote to Free
  const userLooksPaid = isPaidPlanId(planId);
  const subWasActivePaid =
    Boolean(sub) &&
    sub!.status === "ACTIVE" &&
    isPaidPlanId(normalizePlanId(sub!.plan));

  if (userLooksPaid || subWasActivePaid) {
    await demoteUserToFreePlan(userId, {
      reason:
        "Your paid plan period ended. You're on Free now and can keep using AuPairly — upgrade anytime.",
    });
    planId = "FREE";
    sub = await prisma.subscription.findUnique({ where: { userId } });
  }

  return { planId, plan: planFor(planId), subscription: sub };
}

/**
 * Batch-expire all paid plans past currentPeriodEnd.
 * Safe to run from cron; users stay on Free and keep their accounts.
 */
export async function expireDuePaidPlans(): Promise<{
  scanned: number;
  demoted: number;
  userIds: string[];
}> {
  const now = new Date();

  // 1) ACTIVE paid subscriptions with ended period
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan: { in: ["PLUS", "PREMIUM"] },
      OR: [{ currentPeriodEnd: { lte: now } }, { currentPeriodEnd: null }],
    },
    select: { userId: true },
    take: 500,
  });

  // 2) Users still marked paid on User.plan without a valid active period
  const stickyPaidUsers = await prisma.user.findMany({
    where: {
      plan: { in: ["PLUS", "PREMIUM"] },
      OR: [
        { subscription: null },
        {
          subscription: {
            OR: [
              { status: { not: "ACTIVE" } },
              { currentPeriodEnd: { lte: now } },
              { currentPeriodEnd: null },
            ],
          },
        },
      ],
    },
    select: { id: true },
    take: 500,
  });

  const userIds = [
    ...new Set([
      ...expiredSubs.map((s) => s.userId),
      ...stickyPaidUsers.map((u) => u.id),
    ]),
  ];

  let demoted = 0;
  for (const userId of userIds) {
    const result = await demoteUserToFreePlan(userId, {
      reason:
        "Your Plus/Premium period ended. Your account is still here on Free — pick a new period anytime from Pricing.",
    });
    if (result.demoted) demoted += 1;
  }

  return { scanned: userIds.length, demoted, userIds };
}

async function bumpCounter(userId: string, action: string, periodKey: string) {
  const row = await prisma.usageCounter.upsert({
    where: {
      userId_action_dayKey: { userId, action, dayKey: periodKey },
    },
    create: { userId, action, dayKey: periodKey, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count;
}

/**
 * Atomically consume one unit if under limit.
 * Uses increment-then-check; rolls back if over (closes classic TOCTOU race).
 */
async function tryConsumeUnderLimit(
  userId: string,
  action: string,
  periodKey: string,
  limit: number
): Promise<{ ok: true; count: number } | { ok: false; count: number }> {
  const next = await bumpCounter(userId, action, periodKey);
  if (next > limit) {
    await prisma.usageCounter.update({
      where: {
        userId_action_dayKey: { userId, action, dayKey: periodKey },
      },
      data: { count: { decrement: 1 } },
    });
    return { ok: false, count: next - 1 };
  }
  return { ok: true, count: next };
}

async function getCounter(userId: string, action: string, periodKey: string) {
  const row = await prisma.usageCounter.findUnique({
    where: {
      userId_action_dayKey: { userId, action, dayKey: periodKey },
    },
  });
  return row?.count ?? 0;
}

export type LimitCheck =
  | { ok: true; remaining: number | null; plan: PlanDefinition }
  | {
      ok: false;
      reason: string;
      upgradeRequired: true;
      limit: number;
      used: number;
      plan: PlanDefinition;
    };

/** Check (and optionally consume) a daily/weekly limit. */
export async function checkAndConsume(
  userId: string,
  action: "MESSAGE" | "INTEREST" | "SWIPE" | "BOOST",
  opts?: { consume?: boolean }
): Promise<LimitCheck> {
  const consume = opts?.consume !== false;
  const { plan } = await getUserPlan(userId);

  let limit = -1;
  let periodKey = dayKey();

  if (action === "MESSAGE") {
    limit = plan.limits.messagesPerDay;
    periodKey = dayKey();
  } else if (action === "INTEREST") {
    limit = plan.limits.interestsPerWeek;
    periodKey = weekKey();
  } else if (action === "SWIPE") {
    limit = plan.limits.swipesPerDay;
    periodKey = dayKey();
  } else if (action === "BOOST") {
    limit = plan.limits.boostsPerMonth;
    periodKey = dayKey().slice(0, 7); // YYYY-MM
  }

  if (limit < 0) {
    if (consume) await bumpCounter(userId, action, periodKey);
    return { ok: true, remaining: null, plan };
  }

  const actionLabel =
    action === "MESSAGE"
      ? "daily messages"
      : action === "INTEREST"
        ? "weekly interests"
        : action === "SWIPE"
          ? "daily Discover swipes"
          : "monthly boosts";

  if (!consume) {
    const used = await getCounter(userId, action, periodKey);
    if (used >= limit) {
      return {
        ok: false,
        reason: `You've used ${used}/${limit} ${actionLabel} on the ${plan.name} plan. Upgrade with Paystack for unlimited matching.`,
        upgradeRequired: true,
        limit,
        used,
        plan,
      };
    }
    return { ok: true, remaining: Math.max(0, limit - used), plan };
  }

  const result = await tryConsumeUnderLimit(userId, action, periodKey, limit);
  if (!result.ok) {
    return {
      ok: false,
      reason: `You've used ${result.count}/${limit} ${actionLabel} on the ${plan.name} plan. Upgrade with Paystack for unlimited matching.`,
      upgradeRequired: true,
      limit,
      used: result.count,
      plan,
    };
  }

  return { ok: true, remaining: Math.max(0, limit - result.count), plan };
}

export async function activatePlan(
  userId: string,
  planId: PlanId | string,
  opts?: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    days?: number;
  }
) {
  const resolved = normalizePlanId(planId);
  if (!isPaidPlanId(resolved)) {
    throw new Error(`Cannot activate non-paid plan: ${planId}`);
  }

  // Prefer explicit days from checkout period; default 90 (3-month Plus/Premium)
  const days = opts?.days ?? 90;
  const end = new Date();
  end.setDate(end.getDate() + days);

  await prisma.user.update({
    where: { id: userId },
    data: { plan: resolved },
  });

  const sub = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: resolved,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: end,
      stripeSubscriptionId: opts?.stripeSubscriptionId,
      stripePriceId: opts?.stripePriceId,
    },
    update: {
      plan: resolved,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: end,
      stripeSubscriptionId: opts?.stripeSubscriptionId,
      stripePriceId: opts?.stripePriceId,
      cancelAtPeriodEnd: false,
    },
  });

  // Featured listing for paid plans
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === "AUPAIR") {
    await prisma.auPairProfile.updateMany({
      where: { userId },
      data: { isFeatured: true },
    });
  } else if (user?.role === "PARENT") {
    await prisma.familyProfile.updateMany({
      where: { userId },
      data: { isFeatured: true },
    });
  }

  return sub;
}
