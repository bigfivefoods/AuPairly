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
  const sub = user?.subscription ?? null;

  // Prefer active subscription plan if present and not expired
  if (sub && sub.status === "ACTIVE") {
    if (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()) {
      planId = normalizePlanId(sub.plan);
    } else {
      // Expired
      await prisma.user.update({ where: { id: userId }, data: { plan: "FREE" } });
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELED", plan: "FREE" },
      });
      planId = "FREE";
    }
  }

  return { planId, plan: planFor(planId), subscription: sub };
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

  const used = await getCounter(userId, action, periodKey);
  if (used >= limit) {
    const actionLabel =
      action === "MESSAGE"
        ? "daily messages"
        : action === "INTEREST"
          ? "weekly interests"
          : action === "SWIPE"
            ? "daily Discover swipes"
            : "monthly boosts";
    return {
      ok: false,
      reason: `You've used ${used}/${limit} ${actionLabel} on the ${plan.name} plan. Upgrade with Paystack for unlimited matching.`,
      upgradeRequired: true,
      limit,
      used,
      plan,
    };
  }

  if (consume) {
    const next = await bumpCounter(userId, action, periodKey);
    return { ok: true, remaining: Math.max(0, limit - next), plan };
  }

  return { ok: true, remaining: Math.max(0, limit - used), plan };
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
