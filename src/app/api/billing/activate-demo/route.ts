import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import { recordPayment } from "@/lib/payments";
import {
  PLANS,
  durationDaysFor,
  isBillingPeriod,
  isPaidPlanId,
  type BillingPeriod,
  type PlanId,
} from "@/lib/plans";

/**
 * Explicit demo upgrade (no payment) — local / pitch demos only.
 * Disabled in production unless ALLOW_DEMO_BILLING=true (never on Vercel production by default).
 */
export async function POST(req: Request) {
  const allowDemo =
    process.env.ALLOW_DEMO_BILLING === "true" &&
    process.env.VERCEL_ENV !== "production" &&
    process.env.NODE_ENV !== "production";

  if (!allowDemo) {
    return NextResponse.json(
      { error: "Demo billing is disabled. Use Paystack checkout." },
      { status: 403 }
    );
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const planId = body.planId as PlanId;
  if (!isPaidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const period: BillingPeriod = isBillingPeriod(body.period)
    ? body.period
    : "QUARTER";
  const days = durationDaysFor(planId, period);
  const plan = PLANS[planId];

  await activatePlan(session.user.id, planId, { days });
  await recordPayment({
    userId: session.user.id,
    kind: "DEMO",
    amountCents: 0,
    description: `Demo ${plan.name} · ${period} (${days} days)`,
    provider: "demo",
    reference: `demo_activate_${session.user.id}_${planId}_${Date.now()}`,
    meta: { planId, period, demo: true },
  });
  await createNotification({
    userId: session.user.id,
    type: "BILLING",
    title: `${plan.name} unlocked`,
    body: `Your ${days}-day ${plan.name} membership is active. Unlimited matching starts now.`,
    href: "/account",
  });

  return NextResponse.json({ ok: true, plan: planId, period, durationDays: days });
}
