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

const BOOST_CENTS = Number(process.env.BOOST_FEE_CENTS || "4900"); // R49

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isPaystackConfigured()) {
    // Demo boost
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
    return NextResponse.json({ ok: true, boostedUntil: until.toISOString() });
  } catch (err) {
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}
