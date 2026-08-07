/**
 * POST /api/billing/checkout
 * Body: { planId: "PLUS"|"PREMIUM", period: "WEEK"|"QUARTER"|"ANNUAL" }
 *
 * Start membership upgrade via Paystack (SA + Apple Pay).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  PLANS,
  getPeriodPricing,
  isBillingPeriod,
  isPaidPlanId,
  priceCentsFor,
  type BillingPeriod,
  type PlanId,
} from "@/lib/plans";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import { recordPayment } from "@/lib/payments";
import {
  getSiteUrl,
  initializeTransaction,
  isPaystackConfigured,
  makeReference,
  paystackErrorResponse,
  paystackLiveRequiredError,
  paystackMode,
} from "@/lib/paystack";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const planId = body.planId as PlanId;
  const periodRaw = body.period as string | undefined;

  if (!isPaidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const period: BillingPeriod = isBillingPeriod(periodRaw)
    ? periodRaw
    : "QUARTER";
  const plan = PLANS[planId];
  const periodPricing = getPeriodPricing(planId, period);
  if (!periodPricing) {
    return NextResponse.json({ error: "Invalid billing period" }, { status: 400 });
  }

  const role = session.user.role;
  if (role === "ADMIN") {
    return NextResponse.json({ error: "Admins don't need a plan" }, { status: 400 });
  }

  const site = getSiteUrl();

  // Demo free-upgrade only outside production when explicitly enabled
  if (!isPaystackConfigured()) {
    const allowDemo =
      process.env.ALLOW_DEMO_BILLING === "true" &&
      process.env.VERCEL_ENV !== "production" &&
      process.env.NODE_ENV !== "production";

    if (!allowDemo) {
      return NextResponse.json(
        {
          error:
            "Payments are not configured. Please try again later or contact support.",
          upgradeUrl: "/support",
        },
        { status: 503 }
      );
    }

    await activatePlan(session.user.id, planId, {
      days: periodPricing.durationDays,
    });
    await recordPayment({
      userId: session.user.id,
      kind: "DEMO",
      amountCents: 0,
      description: `Demo ${plan.name} · ${periodPricing.label} (${periodPricing.durationDays} days)`,
      provider: "demo",
      reference: `demo_plan_${session.user.id}_${planId}_${period}_${Date.now()}`,
      meta: { planId, period, demo: true },
    });
    await createNotification({
      userId: session.user.id,
      type: "BILLING",
      title: `${plan.name} (${periodPricing.label}) activated (demo)`,
      body: `Paystack is not configured — you got ${periodPricing.durationDays} days of ${plan.name} in demo mode.`,
      href: "/account",
    });
    return NextResponse.json({
      demo: true,
      url: `${site}/billing?success=1&plan=${planId}&period=${period}`,
      message: `Demo upgrade applied. ${periodPricing.durationDays} days of ${plan.name}.`,
    });
  }

  try {
    const liveBlock = paystackLiveRequiredError();
    if (liveBlock) {
      return NextResponse.json(
        {
          error: liveBlock,
          paystackMode: paystackMode(),
          upgradeUrl: "/support",
        },
        { status: 503 }
      );
    }

    const amountCents = priceCentsFor(plan, period);
    if (amountCents < 100) {
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });
    }

    const reference = makeReference(
      `plan_${planId.toLowerCase()}_${period.toLowerCase()}`
    );
    const email = session.user.email;
    if (!email) {
      return NextResponse.json(
        { error: "Account email required for checkout" },
        { status: 400 }
      );
    }

    const init = await initializeTransaction({
      email,
      amountCents,
      reference,
      callbackUrl: `${site}/billing/callback?plan=${planId}&period=${period}`,
      metadata: {
        userId: session.user.id,
        planId,
        period,
        role,
        purpose: "membership",
        durationDays: periodPricing.durationDays,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: `${plan.name} · ${periodPricing.label}`,
          },
          {
            display_name: "User",
            variable_name: "user_id",
            value: session.user.id,
          },
        ],
      },
      channels: ["card", "apple_pay", "bank", "eft", "qr", "bank_transfer"],
    });

    return NextResponse.json({
      demo: false,
      url: init.authorization_url,
      reference: init.reference,
      accessCode: init.access_code,
      provider: "paystack",
    });
  } catch (err) {
    console.error("[billing/checkout paystack]", err);
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
