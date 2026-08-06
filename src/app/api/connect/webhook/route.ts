/**
 * Stripe Connect + Billing webhooks for the sample integration.
 *
 * Two styles of events:
 *
 * 1) THIN / V2 event destinations (Connected accounts)
 *    - v2.core.account[requirements].updated
 *    - v2.core.account[configuration.merchant].capability_status_updated
 *    - v2.core.account[configuration.customer].capability_status_updated
 *    Use stripeClient.parseEventNotification(...) then retrieve full event.
 *    Local CLI:
 *      stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated,v2.core.account[configuration.customer].capability_status_updated' --forward-thin-to localhost:3000/api/connect/webhook
 *
 * 2) Classic snapshot events (platform Billing)
 *    - customer.subscription.*
 *    - invoice.paid / invoice.payment_failed
 *    - checkout.session.completed
 *    Use stripeClient.webhooks.constructEvent(...)
 *
 * Configure both secrets if you use both destinations:
 *   STRIPE_THIN_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  StripeConfigError,
} from "@/lib/stripe-client";
import type Stripe from "stripe";

export const runtime = "nodejs";

// Next.js App Router: need the raw body for signature verification.
export async function POST(req: Request) {
  const stripeClient = (() => {
    try {
      return getStripeClient();
    } catch (e) {
      const msg = e instanceof StripeConfigError ? e.message : "Stripe not configured";
      return { error: msg } as const;
    }
  })();

  if ("error" in stripeClient) {
    return NextResponse.json({ error: stripeClient.error }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // ── Try thin / V2 event notification first ──────────────────────────
  const thinSecret =
    process.env.STRIPE_THIN_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  if (thinSecret && !thinSecret.includes("whsec_***")) {
    try {
      /**
       * parseEventNotification is the current SDK name for "parse thin event".
       * Docs historically showed parseThinEvent — same idea.
       * https://docs.stripe.com/webhooks?snapshot-or-thin=thin
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const thinEvent = (stripeClient as any).parseEventNotification(
        rawBody,
        sig,
        thinSecret
      );

      // Fetch the full event payload (thin notifications only carry an id/type).
      const fullEvent = await stripeClient.v2.core.events.retrieve(thinEvent.id);
      await handleThinEvent(fullEvent);
      return NextResponse.json({ received: true, style: "thin", type: fullEvent.type });
    } catch (thinErr) {
      // Not a thin event (or wrong secret) — fall through to classic constructEvent.
      console.debug(
        "[connect/webhook] thin parse failed, trying classic:",
        thinErr instanceof Error ? thinErr.message : thinErr
      );
    }
  }

  // ── Classic snapshot webhooks ───────────────────────────────────────
  const classicSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!classicSecret || classicSecret.includes("whsec_***")) {
    return NextResponse.json(
      {
        error:
          "Could not verify webhook. Set STRIPE_WEBHOOK_SECRET and/or STRIPE_THIN_WEBHOOK_SECRET.",
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, sig, classicSecret);
  } catch (err) {
    console.error("[connect/webhook] constructEvent failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleClassicEvent(event);
  } catch (err) {
    console.error("[connect/webhook] handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, style: "snapshot", type: event.type });
}

/** Handle V2 thin events (requirements / capability changes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleThinEvent(event: any) {
  const type: string = event.type || event?.data?.object?.object || "unknown";
  console.log("[connect/webhook thin]", type, event.id);

  /**
   * On requirements or capability updates we re-fetch the account live
   * (this demo does not persist onboarding status — only logs + optional notify).
   * In production you might email the seller that more info is needed.
   */
  if (
    type.includes("requirements") ||
    type.includes("capability_status_updated") ||
    type === "v2.core.account[requirements].updated" ||
    type === "v2.core.account[configuration.merchant].capability_status_updated" ||
    type === "v2.core.account[configuration.customer].capability_status_updated"
  ) {
    const accountId =
      event.related_object?.id ||
      event.data?.object?.id ||
      event.account ||
      null;

    if (accountId) {
      // Map back to our user if known
      const user = await prisma.user.findFirst({
        where: { stripeConnectAccountId: accountId },
        select: { id: true, email: true },
      });

      console.log(
        "[connect/webhook] requirements/capability change for",
        accountId,
        "user=",
        user?.id ?? "(unknown)"
      );

      // TODO: notify user that onboarding requirements changed
      // e.g. createNotification({ userId: user.id, type: "BILLING", ... })
    }
    return;
  }

  console.log("[connect/webhook thin] unhandled type", type);
}

/** Handle classic Billing / Checkout events for platform subscriptions. */
async function handleClassicEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata?.userId) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        // TODO: write subscription status to DB (done below when user mapping exists)
        await prisma.user.updateMany({
          where: { id: session.metadata.userId },
          data: {
            connectSubscriptionStatus: "active",
            connectSubscriptionId: subId ?? undefined,
          },
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      const sub = event.data.object as Stripe.Subscription;
      // V2: prefer customer_account (acct_...) over classic customer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subAny = sub as any;
      const accountId: string | undefined =
        subAny.customer_account ||
        sub.metadata?.connectedAccountId ||
        undefined;

      const status = mapSubStatus(sub.status, event.type);

      if (accountId) {
        await prisma.user.updateMany({
          where: { stripeConnectAccountId: accountId },
          data: {
            connectSubscriptionStatus: status,
            connectSubscriptionId: sub.id,
          },
        });
      } else if (sub.metadata?.userId) {
        await prisma.user.updateMany({
          where: { id: sub.metadata.userId },
          data: {
            connectSubscriptionStatus: status,
            connectSubscriptionId: sub.id,
          },
        });
      } else {
        // TODO: lookup by classic customer id if you also use Customers API
        console.warn(
          "[connect/webhook] subscription event without customer_account or metadata.userId",
          sub.id
        );
      }

      // Grant / revoke platform features based on price + quantity
      const priceId = sub.items.data[0]?.price?.id;
      const quantity = sub.items.data[0]?.quantity ?? 1;
      console.log(
        "[connect/webhook] subscription",
        event.type,
        "price=",
        priceId,
        "qty=",
        quantity,
        "status=",
        status
      );
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invAny = invoice as any;
      const accountId = invAny.customer_account as string | undefined;
      console.log("[connect/webhook] invoice.paid", invoice.id, "account=", accountId);
      // TODO: mark invoice paid / extend access window in DB
      if (accountId) {
        await prisma.user.updateMany({
          where: { stripeConnectAccountId: accountId },
          data: { connectSubscriptionStatus: "active" },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invAny = invoice as any;
      const accountId = invAny.customer_account as string | undefined;
      console.log("[connect/webhook] invoice.payment_failed", invoice.id, "account=", accountId);
      // TODO: notify seller, maybe set status past_due
      if (accountId) {
        await prisma.user.updateMany({
          where: { stripeConnectAccountId: accountId },
          data: { connectSubscriptionStatus: "past_due" },
        });
      }
      break;
    }

    case "billing_portal.session.created":
    case "billing_portal.configuration.created":
    case "billing_portal.configuration.updated":
      console.log("[connect/webhook] billing portal event", event.type);
      break;

    default:
      console.log("[connect/webhook] ignored", event.type);
  }
}

function mapSubStatus(stripeStatus: string, eventType: string): string {
  if (eventType === "customer.subscription.deleted") return "canceled";
  if (eventType === "customer.subscription.paused") return "paused";
  return stripeStatus; // active | trialing | past_due | unpaid | canceled | incomplete...
}
