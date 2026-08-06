import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import { PLANS, isPaidPlanId, type PlanId } from "@/lib/plans";

/** Explicit demo upgrade (no payment) for local / pitch demos */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const planId = body.planId as PlanId;
  if (!isPaidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planId];
  await activatePlan(session.user.id, planId);
  await createNotification({
    userId: session.user.id,
    type: "BILLING",
    title: `${plan.name} unlocked`,
    body: `Your ${plan.durationDays}-day membership is active. Unlimited matching starts now.`,
    href: "/discover",
  });

  return NextResponse.json({ ok: true, plan: planId, durationDays: plan.durationDays });
}
