/**
 * Featured listing boost (7 days) via Paystack — R49 default.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getSiteUrl,
  initializeTransaction,
  isPaystackConfigured,
  makeReference,
  paystackErrorResponse,
} from "@/lib/paystack";
import { recordPayment } from "@/lib/payments";

const BOOST_CENTS = Number(process.env.BOOST_FEE_CENTS || "4900"); // R49

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Gate: require solid profile before boost spend / demo boost
  const { marketplaceReady } = await import("@/lib/gates");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      image: true,
      aupairProfile: true,
      familyProfile: true,
    },
  });
  const prof = me?.aupairProfile || me?.familyProfile;
  const gate = marketplaceReady({
    role: session.user.role,
    image: me?.image,
    headline: prof?.headline,
    bio: prof?.bio,
    city: prof?.city,
    country: prof?.country,
    status: prof?.status,
    services: prof?.services,
    isVerified: prof?.isVerified,
  });
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: gate.reason || "Complete your profile before boosting",
        blockers: gate.blockers,
        upgradeRequired: false,
        profileGate: true,
      },
      { status: 403 }
    );
  }

  if (!isPaystackConfigured()) {
    const allowDemo =
      process.env.ALLOW_DEMO_BILLING === "true" &&
      process.env.VERCEL_ENV !== "production" &&
      process.env.NODE_ENV !== "production";
    if (!allowDemo) {
      return NextResponse.json(
        { error: "Payments are not configured. Please try again later." },
        { status: 503 }
      );
    }
    // Demo boost (non-production only)
    const until = new Date();
    until.setDate(until.getDate() + 7);
    if (session.user.role === "AUPAIR") {
      await prisma.auPairProfile.updateMany({
        where: { userId: session.user.id },
        data: { isFeatured: true, boostedUntil: until },
      });
    } else {
      await prisma.familyProfile.updateMany({
        where: { userId: session.user.id },
        data: { isFeatured: true, boostedUntil: until },
      });
    }
    await prisma.boostEvent.create({
      data: {
        userId: session.user.id,
        startedAt: new Date(),
        endsAt: until,
      },
    });
    await recordPayment({
      userId: session.user.id,
      kind: "DEMO",
      amountCents: 0,
      description: "Demo profile boost · 7 days",
      provider: "demo",
      reference: `demo_boost_${session.user.id}_${Date.now()}`,
      meta: { endsAt: until.toISOString(), demo: true },
    });
    return NextResponse.json({
      demo: true,
      boostedUntil: until.toISOString(),
      message: "Demo boost applied for 7 days.",
    });
  }

  try {
    const email = session.user.email;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const site = getSiteUrl();
    const reference = makeReference("boost");
    const init = await initializeTransaction({
      email,
      amountCents: BOOST_CENTS,
      reference,
      callbackUrl: `${site}/boost?paid=1&reference=${reference}`,
      metadata: {
        purpose: "boost",
        userId: session.user.id,
        role: session.user.role,
      },
      channels: ["card", "apple_pay", "bank", "eft"],
    });
    return NextResponse.json({ url: init.authorization_url, reference });
  } catch (err) {
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}

/** Verify boost payment and apply */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const reference = String(body.reference || "");
  if (!reference) return NextResponse.json({ error: "reference required" }, { status: 400 });

  const { verifyTransaction } = await import("@/lib/paystack");
  try {
    const tx = await verifyTransaction(reference);
    if (tx.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 402 });
    }
    const until = new Date();
    until.setDate(until.getDate() + 7);
    if (session.user.role === "AUPAIR") {
      await prisma.auPairProfile.updateMany({
        where: { userId: session.user.id },
        data: { isFeatured: true, boostedUntil: until },
      });
    } else {
      await prisma.familyProfile.updateMany({
        where: { userId: session.user.id },
        data: { isFeatured: true, boostedUntil: until },
      });
    }
    await prisma.boostEvent.create({
      data: {
        userId: session.user.id,
        startedAt: new Date(),
        endsAt: until,
      },
    });
    await recordPayment({
      userId: session.user.id,
      kind: "BOOST",
      amountCents: Number(tx.amount || BOOST_CENTS),
      currency: String(tx.currency || "ZAR").toUpperCase(),
      description: "Featured profile boost · 7 days",
      reference,
      provider: "paystack",
      meta: { endsAt: until.toISOString() },
    });
    return NextResponse.json({ ok: true, boostedUntil: until.toISOString() });
  } catch (err) {
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
