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

  const checkIns = await prisma.placementCheckIn.findMany({
    where: { placementId: id },
    orderBy: { dayOffset: "asc" },
  });

  return NextResponse.json({
    placement: {
      ...p,
      checklist: safeJson(p.checklist),
      offer: p.offerJson ? safeJson(p.offerJson) : null,
      trialFeedback: p.trialFeedback ? safeJson(p.trialFeedback) : null,
      checkIns,
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

  if (body.offer && typeof body.offer === "object") {
    data.offerJson = JSON.stringify(body.offer);
  }
  if (body.acceptOffer === true) {
    if (session.user.id === existing.parentUserId) {
      data.offerAcceptedParentAt = new Date();
    } else {
      data.offerAcceptedAupairAt = new Date();
    }
  }
  if (body.trialFeedback && typeof body.trialFeedback === "object") {
    data.trialFeedback = JSON.stringify(body.trialFeedback);
  }
  if (body.checkIn && typeof body.checkIn === "object") {
    const dayOffset = Number(body.checkIn.dayOffset);
    if (dayOffset === 7 || dayOffset === 30) {
      await prisma.placementCheckIn.upsert({
        where: {
          placementId_dayOffset: { placementId: id, dayOffset },
        },
        create: {
          placementId: id,
          dayOffset,
          response: body.checkIn.response || null,
          rating: body.checkIn.rating != null ? Number(body.checkIn.rating) : null,
          respondedAt: new Date(),
        },
        update: {
          response: body.checkIn.response || null,
          rating: body.checkIn.rating != null ? Number(body.checkIn.rating) : null,
          respondedAt: new Date(),
        },
      });
    }
  }

  const placement = await prisma.placement.update({
    where: { id },
    data,
  });

  // Schedule check-in placeholders when placed + success-fee nudge
  if (body.status === "PLACED") {
    for (const dayOffset of [7, 30]) {
      await prisma.placementCheckIn.upsert({
        where: { placementId_dayOffset: { placementId: id, dayOffset } },
        create: { placementId: id, dayOffset },
        update: {},
      });
    }
    // Success fee is typically paid by the host when placement is confirmed
    if (!existing.successFeePaidAt) {
      await createNotification({
        userId: placement.parentUserId,
        type: "BILLING",
        title: "Placement success fee due",
        body: `Status is Placed. Pay the success fee (R${(placement.successFeeCents / 100).toFixed(0)}) to complete marketplace success tracking.`,
        href: `/placements/${id}`,
      }).catch(() => null);
      const parent = await prisma.user.findUnique({
        where: { id: placement.parentUserId },
        select: { email: true, name: true, emailPrefMessages: true },
      });
      if (parent?.email && parent.emailPrefMessages !== "OFF") {
        const site = (
          process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"
        ).replace(/\/$/, "");
        const { sendEmail } = await import("@/lib/email");
        const first = (parent.name || "there").split(" ")[0];
        const fee = (placement.successFeeCents / 100).toFixed(0);
        void sendEmail({
          to: parent.email,
          subject: `Placement success fee — R${fee}`,
          text: `Hi ${first},\n\nYour placement is marked Placed. Please pay the success fee (R${fee}) on AuPairly.\n\n${site}/placements/${id}\n`,
          html: `<p>Hi ${first},</p><p>Your placement is <strong>Placed</strong>. Pay the success fee (<strong>R${fee}</strong>) to complete the marketplace path.</p><p><a href="${site}/placements/${id}">Open placement &amp; pay</a></p>`,
        }).catch(() => null);
      }
    }
  }

  if (body.status === "INTERVIEW") {
    await createNotification({
      userId:
        session.user.id === placement.parentUserId
          ? placement.aupairUserId
          : placement.parentUserId,
      type: "MATCH",
      title: "Interview stage",
      body: "Propose a Meet time in chat if you haven't already.",
      href: `/placements/${id}`,
    }).catch(() => null);
  }

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
  if (body.offer) {
    await createNotification({
      userId: otherId,
      type: "SYSTEM",
      title: "Offer letter updated",
      body: "Review the placement offer and accept if you agree.",
      href: `/placements/${id}`,
    });
  }
  if (body.acceptOffer) {
    await createNotification({
      userId: otherId,
      type: "SYSTEM",
      title: "Offer accepted",
      body: `${session.user.name} accepted the offer letter.`,
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

  const { paystackLiveRequiredError } = await import("@/lib/paystack");
  const liveBlock = paystackLiveRequiredError();
  if (liveBlock) {
    return NextResponse.json(
      { error: liveBlock, paystackTestBlocked: true },
      { status: 503 }
    );
  }

  try {
    const site = getSiteUrl();
    const email = session.user.email;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Prefer host (parent) as payer when they initiate; otherwise current user
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
