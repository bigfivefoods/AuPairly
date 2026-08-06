/**
 * Seller product catalog (Paystack storefront).
 *
 * GET  ?sellerId=userId  — list active products for a seller's public store
 * POST { name, description?, amountCents } — create product (auth)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const sellerId = new URL(req.url).searchParams.get("sellerId");
  if (!sellerId) {
    return NextResponse.json({ error: "sellerId is required" }, { status: 400 });
  }

  const products = await prisma.marketplaceProduct.findMany({
    where: { sellerUserId: sellerId, active: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, name: true, image: true },
  });

  return NextResponse.json({ seller, products });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const amountCents = Number(body.amountCents);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return NextResponse.json(
      { error: "amountCents must be at least 100 (R1.00)" },
      { status: 400 }
    );
  }

  const product = await prisma.marketplaceProduct.create({
    data: {
      sellerUserId: session.user.id,
      name,
      description,
      amountCents: Math.round(amountCents),
      currency: "ZAR",
    },
  });

  return NextResponse.json({ product });
}
