/**
 * Platform subscription charged TO a connected account (V2).
 *
 * POST /api/connect/subscribe
 *   Start Checkout in mode=subscription using customer_account = connected acct id.
 *
 * POST /api/connect/billing-portal
 *   Open Billing Portal so the connected account can manage their subscription.
 *
 * NOTE: For V2 accounts, use `customer_account` (acct_...) — not classic Customer ids.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getPlatformPriceId,
  getSiteUrl,
  getStripeClient,
  stripeErrorResponse,
} from "@/lib/stripe-client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action === "portal" ? "portal" : "subscribe";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeConnectAccountId: true },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.json(
        { error: "Create a Connect account first." },
        { status: 400 }
      );
    }

    const accountId = user.stripeConnectAccountId;
    const stripeClient = getStripeClient();
    const site = getSiteUrl();

    if (action === "portal") {
      /**
       * Billing Portal for the connected account as customer.
       * Uses customer_account (V2) instead of customer.
       */
      const portal = await stripeClient.billingPortal.sessions.create({
        // V2: customer_account (acct_...) instead of classic Customer id
        customer_account: accountId,
        return_url: `${site}/connect`,
      });

      return NextResponse.json({ url: portal.url });
    }

    // PLACEHOLDER price — set STRIPE_CONNECT_PLATFORM_PRICE_ID
    const priceId = getPlatformPriceId();

    /**
     * Subscription Checkout charged to the connected account itself.
     * customer_account lets us use the same acct_ id as both Connect merchant
     * and billing customer (V2 Accounts).
     */
    const checkout = await stripeClient.checkout.sessions.create({
      // V2: same connected account id acts as the billing customer
      customer_account: accountId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // "Thanks for your order" page (Stripe sample pattern)
      success_url: `${site}/connect/success?session_id={CHECKOUT_SESSION_ID}&plan=Starter`,
      cancel_url: `${site}/connect?sub_canceled=1`,
      metadata: {
        userId: session.user.id,
        purpose: "connect_platform_subscription",
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          connectedAccountId: accountId,
        },
      },
    });

    if (!checkout.url) {
      return NextResponse.json(
        { error: "Subscription checkout missing URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: checkout.url, sessionId: checkout.id });
  } catch (err) {
    console.error("[connect/subscribe]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
