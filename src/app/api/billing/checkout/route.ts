/**
 * POST /api/billing/checkout
 *
 * Start membership upgrade via Paystack (SA + Apple Pay).
 * Redirects user to Paystack hosted authorization_url.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLANS, priceCentsFor, type PlanId } from "@/lib/plans";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import {
  getSiteUrl,
  initializeTransaction,
  isPaystackConfigured,
  makeReference,
  paystackErrorResponse,
} from "@/lib/paystack";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const planId = body.planId as PlanId;
  if (planId !== "PLUS" && planId !== "PREMIUM") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planId];
  const role = session.user.role;
  if (role === "ADMIN") {
    return NextResponse.json({ error: "Admins don't need a plan" }, { status: 400 });
  }

  const site = getSiteUrl();

  // Demo mode when Paystack is not configured (local pitch without keys)
  if (!isPaystackConfigured()) {
    await activatePlan(session.user.id, planId, { days: 30 });
    await createNotification({
      userId: session.user.id,
      type: "BILLING",
      title: `${plan.name} activated (demo)`,
      body: "Paystack is not configured — you got 30 days of access in demo mode.",
      href: "/billing",
    });
    return NextResponse.json({
      demo: true,
      url: `${site}/billing?success=1&plan=${planId}`,
      message: "Demo upgrade applied (no Paystack keys). 30 days of access.",
    });
  }

  try {
    const amountCents = priceCentsFor(plan, role);
    if (amountCents < 100) {
      return NextResponse.json({ error: "Invalid plan amount" }, { status: 400 });
    }

    const reference = makeReference(`plan_${planId.toLowerCase()}`);
    const email = session.user.email;
    if (!email) {
      return NextResponse.json({ error: "Account email required for checkout" }, { status: 400 });
    }

    const init = await initializeTransaction({
      email,
      amountCents,
      reference,
      callbackUrl: `${site}/billing/callback?plan=${planId}`,
      metadata: {
        userId: session.user.id,
        planId,
        role,
        purpose: "membership",
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.name },
          { display_name: "User", variable_name: "user_id", value: session.user.id },
        ],
      },
      // Apple Pay shows when enabled in Paystack Dashboard → Preferences
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
