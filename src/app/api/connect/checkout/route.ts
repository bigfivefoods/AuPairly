/**
 * POST /api/connect/checkout
 *
 * Direct Charge on a connected account + application fee for the platform.
 * Uses Stripe Checkout (hosted) for simplicity.
 *
 * Body: { accountId, priceId?, productId?, quantity? }
 *   - Prefer priceId from the connected account.
 *   - If only productId is given, we expand default_price.
 */

import { NextResponse } from "next/server";
import {
  applicationFeeAmount,
  getSiteUrl,
  getStripeClient,
  stripeErrorResponse,
} from "@/lib/stripe-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accountId = String(body.accountId || "");
    let priceId = body.priceId ? String(body.priceId) : "";
    const productId = body.productId ? String(body.productId) : "";
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!accountId.startsWith("acct_")) {
      return NextResponse.json(
        { error: "Valid connected accountId (acct_...) is required" },
        { status: 400 }
      );
    }

    const stripeClient = getStripeClient();
    const site = getSiteUrl();

    // Resolve unit amount so we can compute application_fee_amount.
    let unitAmount = 0;
    let currency = "usd";

    if (!priceId && productId) {
      const product = await stripeClient.products.retrieve(
        productId,
        { expand: ["default_price"] },
        { stripeAccount: accountId }
      );
      const dp = product.default_price;
      if (typeof dp === "object" && dp !== null) {
        priceId = dp.id;
        unitAmount = dp.unit_amount ?? 0;
        currency = dp.currency ?? "usd";
      }
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId or productId with a default price is required" },
        { status: 400 }
      );
    }

    if (!unitAmount) {
      const price = await stripeClient.prices.retrieve(
        priceId,
        {},
        { stripeAccount: accountId }
      );
      unitAmount = price.unit_amount ?? 0;
      currency = price.currency ?? "usd";
    }

    const fee = applicationFeeAmount(unitAmount, quantity);

    /**
     * Direct Charge: Checkout Session is created ON the connected account
     * (stripeAccount option). payment_intent_data.application_fee_amount
     * takes the platform's cut in the smallest currency unit.
     */
    const checkoutSession = await stripeClient.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        payment_intent_data: {
          application_fee_amount: fee,
        },
        success_url: `${site}/store/${accountId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/store/${accountId}?canceled=1`,
      },
      {
        stripeAccount: accountId,
      }
    );

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Checkout session created without a redirect URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      applicationFeeAmount: fee,
      currency,
    });
  } catch (err) {
    console.error("[connect/checkout]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
