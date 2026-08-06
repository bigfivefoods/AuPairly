/**
 * POST /api/connect/account
 *   Create a Stripe Connect V2 account for the signed-in user (if missing),
 *   store the mapping user.id → account.id in the database.
 *
 * GET /api/connect/account
 *   Return the user's connected account id + live onboarding status from Stripe API.
 *   Status is ALWAYS fetched from the API (not stored) as required for this demo.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  stripeErrorResponse,
} from "@/lib/stripe-client";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeConnectAccountId: true,
        connectSubscriptionStatus: true,
        connectSubscriptionId: true,
        name: true,
        email: true,
      },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.json({
        accountId: null,
        hasAccount: false,
        message: "No connected account yet. Create one to collect payments.",
      });
    }

    const stripeClient = getStripeClient();

    // Always load status live from the V2 Accounts API (do not cache in DB for this demo).
    // include: merchant config + requirements so we can compute onboarding completeness.
    const account = await stripeClient.v2.core.accounts.retrieve(
      user.stripeConnectAccountId,
      {
        include: ["configuration.merchant", "configuration.customer", "requirements"],
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acc = account as any;

    const cardPaymentsStatus =
      acc?.configuration?.merchant?.capabilities?.card_payments?.status ?? "unknown";

    const readyToProcessPayments = cardPaymentsStatus === "active";

    // requirements.summary.minimum_deadline.status indicates if KYC is still due.
    const requirementsStatus =
      acc?.requirements?.summary?.minimum_deadline?.status ?? null;

    const onboardingComplete =
      requirementsStatus !== "currently_due" &&
      requirementsStatus !== "past_due";

    return NextResponse.json({
      hasAccount: true,
      accountId: user.stripeConnectAccountId,
      displayName: acc?.display_name ?? user.name,
      contactEmail: acc?.contact_email ?? user.email,
      dashboard: acc?.dashboard ?? null,
      cardPaymentsStatus,
      readyToProcessPayments,
      requirementsStatus,
      onboardingComplete,
      // Platform subscription (seller plan charged TO the connected account)
      connectSubscriptionStatus: user.connectSubscriptionStatus ?? "none",
      connectSubscriptionId: user.connectSubscriptionId ?? null,
      // Public storefront path — for production use a slug, not raw acct_ id.
      storefrontPath: `/store/${user.stripeConnectAccountId}`,
    });
  } catch (err) {
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        stripeConnectAccountId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Idempotent: if we already mapped a Connect account, return it.
    if (user.stripeConnectAccountId) {
      return NextResponse.json({
        accountId: user.stripeConnectAccountId,
        created: false,
      });
    }

    const stripeClient = getStripeClient();

    /**
     * Create a V2 Connected Account.
     * IMPORTANT: only use the properties below — never pass top-level `type`
     * (no express / standard / custom).
     */
    const account = await stripeClient.v2.core.accounts.create({
      display_name: user.name || user.email,
      contact_email: user.email,
      identity: {
        country: "us",
      },
      dashboard: "full",
      defaults: {
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
      configuration: {
        customer: {},
        merchant: {
          capabilities: {
            card_payments: {
              requested: true,
            },
          },
        },
      },
    });

    // Persist mapping: App User → Stripe Connect account id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectAccountId: account.id },
    });

    return NextResponse.json({
      accountId: account.id,
      created: true,
    });
  } catch (err) {
    console.error("[connect/account POST]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
