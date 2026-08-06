/**
 * POST /api/connect/onboard
 *
 * Creates a V2 Account Link so the seller can complete Stripe-hosted onboarding
 * (identity, bank details, etc.). Returns { url } for the browser to redirect to.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getSiteUrl,
  getStripeClient,
  stripeErrorResponse,
} from "@/lib/stripe-client";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeConnectAccountId: true },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.json(
        {
          error:
            "No connected account yet. Call POST /api/connect/account first (or use the dashboard button).",
        },
        { status: 400 }
      );
    }

    const accountId = user.stripeConnectAccountId;
    const stripeClient = getStripeClient();
    const site = getSiteUrl();

    /**
     * V2 Account Links — hosted onboarding for merchant + customer configs.
     * refresh_url: used if the link expires mid-flow (user restarts).
     * return_url: where Stripe sends the user after finishing.
     */
    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "customer"],
          refresh_url: `${site}/connect?refresh=1`,
          return_url: `${site}/connect?return=1&accountId=${encodeURIComponent(accountId)}`,
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const link = accountLink as any;
    const url = link.url || link.account_link?.url;

    if (!url) {
      return NextResponse.json(
        {
          error:
            "Stripe returned an account link without a URL. Check API version / response shape.",
          raw: link,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ url, accountId });
  } catch (err) {
    console.error("[connect/onboard]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
