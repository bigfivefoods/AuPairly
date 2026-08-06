/**
 * POST /api/billing/webhook
 *
 * Paystack webhooks (not Stripe).
 * Configure at: Dashboard → Settings → API Keys & Webhooks
 * URL: https://www.aupairly.me/api/billing/webhook
 *
 * Events we handle:
 *   - charge.success
 *   - subscription.create / subscription.disable / subscription.not_renew
 *
 * Signature: x-paystack-signature = HMAC SHA512(body, secret key)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activatePlan } from "@/lib/entitlements";
import { createNotification } from "@/lib/notifications";
import {
  isPaystackConfigured,
  verifyPaystackSignature,
} from "@/lib/paystack";
import type { PlanId } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const valid = await verifyPaystackSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.event as string;
  const data = event.data || {};

  try {
    if (type === "charge.success") {
      await handleChargeSuccess(data);
    } else if (
      type === "subscription.create" ||
      type === "subscription.enable"
    ) {
      await handleSubscriptionActive(data);
    } else if (
      type === "subscription.disable" ||
      type === "subscription.not_renew"
    ) {
      await handleSubscriptionCancel(data);
    } else {
      console.log("[paystack webhook] ignored", type);
    }
  } catch (err) {
    console.error("[paystack webhook] handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleChargeSuccess(data: any) {
  const meta = normalizeMeta(data.metadata);
  const purpose = String(meta.purpose || "membership");
  const userId = meta.userId ? String(meta.userId) : null;
  const planId = coercePlan(meta.planId);

  if (purpose === "membership" && userId && planId && planId !== "FREE") {
    await activatePlan(userId, planId, {
      days: 30,
      stripeSubscriptionId: data.reference,
    });
    await createNotification({
      userId,
      type: "BILLING",
      title: "Payment successful",
      body: `Your ${planId} membership is active. Welcome to unlimited matching.`,
      href: "/billing",
    });
    return;
  }

  // Storefront / product purchase — log only for now
  if (purpose === "product") {
    console.log(
      "[paystack] product purchase",
      data.reference,
      "product=",
      meta.productId,
      "seller=",
      meta.sellerUserId
    );
  }

  if (purpose === "boost" && userId) {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === "AUPAIR") {
      await prisma.auPairProfile.updateMany({
        where: { userId },
        data: { isFeatured: true, boostedUntil: until },
      });
    } else {
      await prisma.familyProfile.updateMany({
        where: { userId },
        data: { isFeatured: true, boostedUntil: until },
      });
    }
    await createNotification({
      userId,
      type: "BILLING",
      title: "Boost activated",
      body: "Your listing is featured for 7 days.",
      href: "/boost",
    });
  }

  if (purpose === "success_fee" && meta.placementId) {
    await prisma.placement.updateMany({
      where: { id: String(meta.placementId) },
      data: {
        successFeePaidAt: new Date(),
        successFeeRef: data.reference,
      },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActive(data: any) {
  const meta = normalizeMeta(data.metadata);
  const userId = meta.userId ? String(meta.userId) : null;
  const planId = (coercePlan(meta.planId) || "PLUS") as "PLUS" | "PREMIUM";
  if (!userId) return;

  await activatePlan(userId, planId, {
    days: 32,
    stripeSubscriptionId: data.subscription_code || data.id,
  });
  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      connectSubscriptionStatus: "active",
      connectSubscriptionId: String(data.subscription_code || data.id || ""),
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCancel(data: any) {
  const meta = normalizeMeta(data.metadata);
  let userId = meta.userId ? String(meta.userId) : null;

  // Fallback: find by subscription code stored on user
  if (!userId && data.subscription_code) {
    const user = await prisma.user.findFirst({
      where: { connectSubscriptionId: String(data.subscription_code) },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "FREE",
      connectSubscriptionStatus: "canceled",
    },
  });
  await prisma.subscription.updateMany({
    where: { userId },
    data: { status: "CANCELED", plan: "FREE" },
  });
}

function normalizeMeta(meta: unknown): Record<string, unknown> {
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

function coercePlan(v: unknown): PlanId | null {
  if (v === "PLUS" || v === "PREMIUM") return v;
  return null;
}
