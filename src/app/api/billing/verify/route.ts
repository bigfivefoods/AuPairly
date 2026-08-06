/**
 * POST /api/billing/verify
 * Body: { reference, planId?, period? }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import {
  durationDaysFor,
  isBillingPeriod,
  isPaidPlanId,
  normalizePlanId,
  planFor,
  type BillingPeriod,
  type PlanId,
} from "@/lib/plans";
import {
  paystackErrorResponse,
  verifyTransaction,
} from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

function parseMetadata(meta: unknown): Record<string, unknown> {
  if (!meta) return {};
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof meta === "object") return meta as Record<string, unknown>;
  return {};
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    if (!reference) {
      return NextResponse.json({ error: "reference is required" }, { status: 400 });
    }

    const tx = await verifyTransaction(reference);
    if (tx.status !== "success") {
      return NextResponse.json(
        { error: `Payment not successful (status: ${tx.status})`, status: tx.status },
        { status: 402 }
      );
    }

    const meta = parseMetadata(tx.metadata);
    const planId: PlanId = normalizePlanId(
      String(body.planId || meta.planId || "PLUS")
    );
    if (!isPaidPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan on payment" }, { status: 400 });
    }

    const periodRaw = body.period || meta.period;
    const period: BillingPeriod = isBillingPeriod(
      periodRaw != null ? String(periodRaw) : null
    )
      ? (String(periodRaw) as BillingPeriod)
      : "QUARTER";

    const metaUserId = meta.userId ? String(meta.userId) : null;
    if (metaUserId && metaUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Payment does not belong to this user" },
        { status: 403 }
      );
    }

    const days = durationDaysFor(planId, period);
    const plan = planFor(planId);

    await activatePlan(session.user.id, planId, {
      days,
      stripeSubscriptionId: reference,
    });

    const customerCode = tx.customer?.customer_code;
    if (customerCode) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerCode },
      });
    }

    await createNotification({
      userId: session.user.id,
      type: "BILLING",
      title: "Payment successful",
      body: `Your ${plan.name} membership is active for ${days} days. Paid via Paystack.`,
      href: "/billing",
    });

    return NextResponse.json({
      ok: true,
      plan: planId,
      period,
      reference,
      amount: tx.amount,
      currency: tx.currency,
      durationDays: days,
    });
  } catch (err) {
    console.error("[billing/verify]", err);
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
