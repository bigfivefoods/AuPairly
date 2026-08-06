/**
 * Product management on a *connected* account (Direct Charges model).
 *
 * GET  /api/connect/products?accountId=acct_...
 *   List active products on that connected account (uses Stripe-Account header).
 *
 * POST /api/connect/products
 *   Create a product + default price on the signed-in user's connected account.
 *   Body: { name, description?, priceInCents, currency? }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  stripeErrorResponse,
} from "@/lib/stripe-client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // NOTE: For production, prefer a public slug → accountId lookup rather than
    // exposing raw Stripe account IDs in URLs. This demo uses accountId for simplicity.
    const accountId = searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json(
        { error: "Query param accountId is required" },
        { status: 400 }
      );
    }

    const stripeClient = getStripeClient();

    // Stripe-Account header via second argument `stripeAccount`.
    const products = await stripeClient.products.list(
      {
        limit: 20,
        active: true,
        expand: ["data.default_price"],
      },
      {
        stripeAccount: accountId,
      }
    );

    return NextResponse.json({
      accountId,
      products: products.data.map((p) => {
        const price = p.default_price;
        const priceObj = typeof price === "object" && price !== null ? price : null;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images,
          active: p.active,
          defaultPriceId: priceObj?.id ?? (typeof price === "string" ? price : null),
          unitAmount: priceObj && "unit_amount" in priceObj ? priceObj.unit_amount : null,
          currency: priceObj && "currency" in priceObj ? priceObj.currency : null,
        };
      }),
    });
  } catch (err) {
    console.error("[connect/products GET]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}

export async function POST(req: Request) {
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
        { error: "Create and onboard a Connect account before adding products." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const description = body.description ? String(body.description).trim() : undefined;
    const priceInCents = Number(body.priceInCents);
    const currency = String(body.currency || "usd").toLowerCase();

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!Number.isFinite(priceInCents) || priceInCents < 50) {
      return NextResponse.json(
        { error: "priceInCents must be a number >= 50 (Stripe minimum for most currencies)" },
        { status: 400 }
      );
    }

    const stripeClient = getStripeClient();
    const accountId = user.stripeConnectAccountId;

    // Create product ON the connected account (Stripe-Account header).
    const product = await stripeClient.products.create(
      {
        name,
        description,
        default_price_data: {
          unit_amount: Math.round(priceInCents),
          currency,
        },
      },
      {
        stripeAccount: accountId,
      }
    );

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        defaultPriceId:
          typeof product.default_price === "string"
            ? product.default_price
            : product.default_price?.id ?? null,
      },
      accountId,
    });
  } catch (err) {
    console.error("[connect/products POST]", err);
    const { error, code, status } = stripeErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
