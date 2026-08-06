/**
 * POST /api/connect/create-portal-session
 *
 * Mirrors Stripe's sample "create-portal-session" endpoint used on the
 * "Thanks for your order" page:
 *
 *   <form action="/create-portal-session" method="POST">
 *     <input type="hidden" name="session_id" value="cs_..." />
 *     <button>Manage your billing information</button>
 *   </form>
 *
 * Accepts:
 *   - session_id from completed Checkout Session (preferred)
 *   - signed-in user with a Connect account / classic customer id
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getSiteUrl,
  getStripeClient,
  stripeErrorResponse,
} from "@/lib/stripe-client";

export async function POST(req: Request) {
  try {
    const stripeClient = getStripeClient();
    const site = getSiteUrl();
    const contentType = req.headers.get("content-type") || "";
    const isForm =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    let sessionId = "";
    if (isForm) {
      const form = await req.formData();
      sessionId = String(form.get("session_id") || "");
    } else {
      const body = await req.json().catch(() => ({}));
      sessionId = String(body.session_id || body.sessionId || "");
    }

    let customerAccount: string | undefined;
    let customer: string | undefined;

    if (sessionId) {
      // Look up who paid from the Checkout Session (Stripe sample pattern)
      const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cs = checkoutSession as any;

      if (cs.customer_account) {
        // V2 Connect: same acct_ id is the billing customer
        customerAccount = String(cs.customer_account);
      } else if (typeof cs.customer === "string") {
        customer = cs.customer;
      } else if (cs.customer?.id) {
        customer = String(cs.customer.id);
      }
    } else {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Provide session_id or sign in to open the billing portal." },
          { status: 401 }
        );
      }
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeConnectAccountId: true, stripeCustomerId: true },
      });
      if (user?.stripeConnectAccountId) {
        customerAccount = user.stripeConnectAccountId;
      } else if (user?.stripeCustomerId) {
        customer = user.stripeCustomerId;
      }
    }

    if (!customerAccount && !customer) {
      return NextResponse.json(
        {
          error:
            "Could not resolve a Stripe customer for the billing portal. " +
            "Complete a subscription checkout first.",
        },
        { status: 400 }
      );
    }

    const portalSession = await stripeClient.billingPortal.sessions.create({
      ...(customerAccount
        ? { customer_account: customerAccount }
        : { customer: customer! }),
      return_url: `${site}/connect`,
    });

    // Classic HTML form POST → redirect (Stripe sample behavior)
    if (isForm) {
      return NextResponse.redirect(portalSession.url, 303);
    }

    // JSON / SPA client
    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[create-portal-session]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
