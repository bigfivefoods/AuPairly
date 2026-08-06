/**
 * POST /api/paystack/checkout
 * Buy a MarketplaceProduct via Paystack (cards + Apple Pay when enabled).
 *
 * Body: { productId, email? }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSiteUrl,
  initializeTransaction,
  isPaystackConfigured,
  makeReference,
  paystackErrorResponse,
} from "@/lib/paystack";

export async function POST(req: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      {
        error:
          "Paystack is not configured. Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const productId = String(body.productId || "");
    const email = String(body.email || "").trim();

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid customer email is required for Paystack checkout" },
        { status: 400 }
      );
    }

    const product = await prisma.marketplaceProduct.findFirst({
      where: { id: productId, active: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const site = getSiteUrl();
    const reference = makeReference("prod");

    const init = await initializeTransaction({
      email,
      amountCents: product.amountCents,
      reference,
      // Paystack appends ?reference=...&trxref=... to callback_url
      callbackUrl: `${site}/store/u/${product.sellerUserId}/success`,
      metadata: {
        purpose: "product",
        productId: product.id,
        sellerUserId: product.sellerUserId,
        productName: product.name,
      },
      channels: ["card", "apple_pay", "bank", "eft", "qr", "bank_transfer"],
    });

    return NextResponse.json({
      url: init.authorization_url,
      reference: init.reference,
      provider: "paystack",
    });
  } catch (err) {
    console.error("[paystack/checkout]", err);
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
