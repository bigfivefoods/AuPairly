/**
 * POST /api/billing/verify
 * Body: { reference, planId? }
 *
 * Verifies a Paystack transaction and activates the membership plan.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import {
  isPaidPlanId,
  normalizePlanId,
  planFor,
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
    const planIdRaw = String(body.planId || meta.planId || "QUARTER");
    const planId: PlanId = normalizePlanId(planIdRaw);
    if (!isPaidPlanId(planId)) {
      return NextResponse.json({ error: "Invalid plan on payment" }, { status: 400 });
    }

    const metaUserId = meta.userId ? String(meta.userId) : null;
    if (metaUserId && metaUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Payment does not belong to this user" },
        { status: 403 }
      );
    }

    const plan = planFor(planId);
    await activatePlan(session.user.id, planId, {
      days: plan.durationDays,
      stripeSubscriptionId: reference, // reuse field as external payment ref
    });

    // Store Paystack customer code if present
    const customerCode = tx.customer?.customer_code;
    if (customerCode) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerCode }, // legacy column — stores Paystack customer_code
      });
    }

    await createNotification({
      userId: session.user.id,
      type: "BILLING",
      title: "Payment successful",
      body: `Your ${plan.name} membership is active for ${plan.durationDays} days. Paid via Paystack.`,
      href: "/billing",
    });

    return NextResponse.json({
      ok: true,
      plan: planId,
      reference,
      amount: tx.amount,
      currency: tx.currency,
      durationDays: plan.durationDays,
    });
  } catch (err) {
    console.error("[billing/verify]", err);
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
