import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { PLACEMENT_STATUSES } from "@/lib/safety";
import {
  getSiteUrl,
  initializeTransaction,
  isPaystackConfigured,
  makeReference,
  paystackErrorResponse,
} from "@/lib/paystack";

async function getMine(id: string, userId: string) {
  return prisma.placement.findFirst({
    where: {
      id,
      OR: [{ parentUserId: userId }, { aupairUserId: userId }],
    },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const p = await getMine(id, session.user.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const users = await prisma.user.findMany({
    where: { id: { in: [p.parentUserId, p.aupairUserId] } },
    select: { id: true, name: true, image: true, role: true, email: true },
  });

  return NextResponse.json({
    placement: {
      ...p,
      checklist: safeJson(p.checklist),
      parent: users.find((u) => u.id === p.parentUserId),
      aupair: users.find((u) => u.id === p.aupairUserId),
    },
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await getMine(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status) {
    if (!PLACEMENT_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === "PLACED") data.placedAt = new Date();
    if (body.status === "COMPLETED") data.completedAt = new Date();
    if (body.status === "INTERVIEW" && body.interviewAt) {
      data.interviewAt = new Date(body.interviewAt);
    }
    if (body.status === "TRIAL") {
      if (body.trialStart) data.trialStart = new Date(body.trialStart);
      if (body.trialEnd) data.trialEnd = new Date(body.trialEnd);
    }
  }

  if (body.interviewAt) data.interviewAt = new Date(body.interviewAt);
  if (body.interviewNotes != null) data.interviewNotes = String(body.interviewNotes);
  if (body.trialStart) data.trialStart = new Date(body.trialStart);
  if (body.trialEnd) data.trialEnd = new Date(body.trialEnd);
  if (body.trialNotes != null) data.trialNotes = String(body.trialNotes);
  if (body.checklist && typeof body.checklist === "object") {
    data.checklist = JSON.stringify(body.checklist);
  }
  if (body.contractText != null) data.contractText = String(body.contractText);

  const placement = await prisma.placement.update({
    where: { id },
    data,
  });

  const otherId =
    session.user.id === placement.parentUserId
      ? placement.aupairUserId
      : placement.parentUserId;

  if (body.status) {
    await createNotification({
      userId: otherId,
      type: "SYSTEM",
      title: "Placement updated",
      body: `Status is now ${body.status}.`,
      href: `/placements/${id}`,
    });
  }

  return NextResponse.json({ placement });
}

/** Start success-fee payment when status is PLACED */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const placement = await getMine(id, session.user.id);
  if (!placement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "success_fee") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (placement.status !== "PLACED" && placement.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Success fee is available after status is Placed" },
      { status: 400 }
    );
  }
  if (placement.successFeePaidAt) {
    return NextResponse.json({ error: "Success fee already paid", paid: true }, { status: 400 });
  }

  if (!isPaystackConfigured()) {
    // Demo: mark paid
    await prisma.placement.update({
      where: { id },
      data: {
        successFeePaidAt: new Date(),
        successFeeRef: "demo_success_fee",
      },
    });
    return NextResponse.json({
      demo: true,
      message: "Demo success fee recorded (Paystack not configured).",
    });
  }

  try {
    const site = getSiteUrl();
    const email = session.user.email;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const reference = makeReference("success");
    const init = await initializeTransaction({
      email,
      amountCents: placement.successFeeCents,
      reference,
      callbackUrl: `${site}/placements/${id}?fee=1&reference=${reference}`,
      metadata: {
        purpose: "success_fee",
        placementId: id,
        userId: session.user.id,
      },
      channels: ["card", "apple_pay", "bank", "eft", "qr", "bank_transfer"],
    });

    await prisma.placement.update({
      where: { id },
      data: { successFeeRef: reference },
    });

    return NextResponse.json({ url: init.authorization_url, reference });
  } catch (err) {
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
