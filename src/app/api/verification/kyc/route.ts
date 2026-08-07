/**
 * POST /api/verification/kyc
 *
 * South Africa (VerifyNow):
 *   { country: "ZA", idNumber, selfieBase64?, referenceImageBase64?, paymentReference? }
 *
 * Pricing:
 *   FREE plan  → R10 via Paystack (KYC_VERIFYNOW_FEE_CENTS, default 1000)
 *   PLUS/PREMIUM (active) → free, included with membership
 *   Paystack not configured → demo free path
 *
 * International (Didit hosted, or manual fallback):
 *   { country: "US" | "GB" | ... }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { refreshUserVerifiedBadge } from "@/lib/verification";
import { resolveKycRegion, kycProvidersStatus } from "@/lib/kyc";
import {
  isValidSaIdNumber,
  verifyFaceMatch,
  verifySaIdNumber,
  isVerifyNowConfigured,
  verifyNowMode,
} from "@/lib/kyc/verifynow";
import {
  createInternationalSession,
  diditStatusOutcome,
  fetchDiditSessionDecision,
  isDiditConfigured,
} from "@/lib/kyc/didit";
import {
  getSiteUrl,
  initializeTransaction,
  isPaystackConfigured,
  makeReference,
  paystackErrorResponse,
  verifyTransaction,
} from "@/lib/paystack";
import { formatZar, recordPayment } from "@/lib/payments";
import { getUserPlan } from "@/lib/entitlements";
import { isPaidPlanId, type PlanId } from "@/lib/plans";

/** Free-plan VerifyNow fee in cents (R10 default). Paid plans: R0. */
export function freePlanVerifyNowFeeCents(): number {
  const n = Number(process.env.KYC_VERIFYNOW_FEE_CENTS || "1000");
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 1000;
}

export function resolveVerifyNowFee(planId: PlanId): {
  feeCents: number;
  free: boolean;
  planId: PlanId;
  label: string;
  reason: string;
} {
  if (isPaidPlanId(planId)) {
    return {
      feeCents: 0,
      free: true,
      planId,
      label: "Free",
      reason: "Included with Plus/Premium",
    };
  }
  const feeCents = freePlanVerifyNowFeeCents();
  return {
    feeCents,
    free: feeCents === 0,
    planId: "FREE",
    label: feeCents === 0 ? "Free" : formatZar(feeCents),
    reason: feeCents === 0 ? "No fee configured" : "Free plan VerifyNow fee",
  };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      kycProvider: true,
      kycExternalId: true,
      kycVerifiedAt: true,
      kycCountry: true,
      idNumberLast4: true,
      facebookId: true,
    },
  });
  let credits: { available: number; organizationName?: string } | null = null;
  if (kycProvidersStatus().verifynow) {
    const { getVerifyNowCredits } = await import("@/lib/kyc/verifynow");
    credits = await getVerifyNowCredits().catch(() => null);
  }

  // Optional: reconcile Didit session when user returns with ?sessionId=
  const url = new URL(req.url);
  const syncSession =
    url.searchParams.get("syncSession") ||
    url.searchParams.get("verificationSessionId");
  let diditSync: { status?: string; outcome?: string } | null = null;
  if (syncSession && isDiditConfigured()) {
    try {
      const decision = await fetchDiditSessionDecision(syncSession);
      const outcome = diditStatusOutcome(decision.status);
      if (outcome !== "ignore") {
        for (const type of ["ID", "SELFIE"] as const) {
          await prisma.verification.deleteMany({
            where: { userId: session.user.id, type },
          });
          await prisma.verification.create({
            data: {
              userId: session.user.id,
              type,
              status: outcome,
              notes: `Didit callback sync: ${decision.status} · session ${syncSession}`,
              reviewedAt: outcome === "PENDING" ? null : new Date(),
            },
          });
        }
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            kycProvider: "didit",
            kycExternalId: syncSession,
            kycVerifiedAt: outcome === "VERIFIED" ? new Date() : null,
          },
        });
        await refreshUserVerifiedBadge(session.user.id);
        diditSync = { status: decision.status, outcome };
      }
    } catch {
      diditSync = { status: "sync_failed" };
    }
  }

  const { planId } = await getUserPlan(session.user.id);
  const fee = resolveVerifyNowFee(planId);
  const paystackRequired =
    isPaystackConfigured() && !fee.free && fee.feeCents > 0;

  return NextResponse.json({
    providers: kycProvidersStatus(),
    verifynow: {
      mode: isVerifyNowConfigured() ? verifyNowMode() : "off",
      live: isVerifyNowConfigured() && verifyNowMode() === "production",
      credits,
      feeCents: fee.feeCents,
      feeLabel: fee.label,
      free: fee.free,
      feeReason: fee.reason,
      planId: fee.planId,
      paystackRequired,
      configured: isVerifyNowConfigured(),
    },
    didit: {
      configured: isDiditConfigured(),
      workflowIdSet: Boolean(process.env.DIDIT_WORKFLOW_ID),
    },
    user,
    diditSync,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`kyc:${session.user.id}`, { limit: 8, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many KYC attempts" }, { status: 429 });
  }

  let body: {
    country?: string;
    idNumber?: string;
    selfieBase64?: string;
    referenceImageBase64?: string;
    paymentReference?: string;
    /** When true, only create Paystack checkout (do not run VerifyNow yet) */
    checkoutOnly?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const region = resolveKycRegion(body.country);
  const userId = session.user.id;

  if (region === "ZA") {
    return runSouthAfricaKyc(userId, session.user.email || "", body);
  }

  return runInternationalKyc(userId, session.user.email || "", session.user.name || "User", body.country);
}

/**
 * Ensure payment (or complimentary access) for VerifyNow.
 * FREE plan → R10 Paystack when configured.
 * PLUS/PREMIUM → free.
 */
async function ensureVerifyNowPayment(
  userId: string,
  email: string,
  idNumber: string,
  paymentReference?: string
): Promise<
  | { ok: true; reference: string; demo?: boolean; complimentary?: boolean; feeCents: number }
  | NextResponse
> {
  const { planId } = await getUserPlan(userId);
  const fee = resolveVerifyNowFee(planId);

  // Paid membership: free VerifyNow
  if (fee.free || fee.feeCents === 0) {
    const ref = `included_kyc_${userId}_${Date.now()}`;
    await recordPayment({
      userId,
      kind: "KYC",
      amountCents: 0,
      description: `VerifyNow SA identity check · free (${fee.reason})`,
      provider: isPaidPlanId(planId) ? "membership" : "demo",
      reference: ref,
      meta: {
        purpose: "kyc_verifynow",
        planId,
        complimentary: true,
        idLast4: idNumber.slice(-4),
      },
    });
    return {
      ok: true,
      reference: ref,
      complimentary: true,
      feeCents: 0,
    };
  }

  // Paystack not configured → demo free (local/dev)
  if (!isPaystackConfigured()) {
    const ref = `demo_kyc_${userId}_${Date.now()}`;
    await recordPayment({
      userId,
      kind: "KYC",
      amountCents: 0,
      description: "Demo VerifyNow KYC (Paystack not configured)",
      provider: "demo",
      reference: ref,
      meta: { demo: true, planId, idLast4: idNumber.slice(-4) },
    });
    return { ok: true, reference: ref, demo: true, feeCents: 0 };
  }

  if (!email) {
    return NextResponse.json(
      { error: "Email is required to pay for identity verification" },
      { status: 400 }
    );
  }

  const requiredCents = fee.feeCents;

  // Already paid this reference?
  if (paymentReference) {
    const existing = await prisma.paymentTransaction.findUnique({
      where: { reference: paymentReference },
    });
    if (
      existing &&
      existing.userId === userId &&
      existing.kind === "KYC" &&
      existing.status === "SUCCESS" &&
      existing.amountCents >= requiredCents
    ) {
      return { ok: true, reference: paymentReference, feeCents: existing.amountCents };
    }

    try {
      const tx = await verifyTransaction(paymentReference);
      if (tx.status !== "success") {
        return NextResponse.json(
          {
            error:
              "Payment not completed yet. Finish Paystack checkout, then try again.",
          },
          { status: 402 }
        );
      }
      if (Number(tx.amount) < requiredCents) {
        return NextResponse.json(
          {
            error: `Payment amount too low. VerifyNow costs ${formatZar(requiredCents)} on Free.`,
          },
          { status: 402 }
        );
      }
      const meta =
        typeof tx.metadata === "object" && tx.metadata
          ? (tx.metadata as Record<string, unknown>)
          : {};
      if (meta.userId && String(meta.userId) !== userId) {
        return NextResponse.json(
          { error: "Payment belongs to another account" },
          { status: 403 }
        );
      }
      if (meta.purpose && String(meta.purpose) !== "kyc_verifynow") {
        return NextResponse.json(
          { error: "Payment is not for identity verification" },
          { status: 400 }
        );
      }

      await recordPayment({
        userId,
        kind: "KYC",
        amountCents: Number(tx.amount || requiredCents),
        currency: String(tx.currency || "ZAR").toUpperCase(),
        description: `VerifyNow SA identity check · ${formatZar(requiredCents)}`,
        reference: paymentReference,
        provider: "paystack",
        meta: {
          purpose: "kyc_verifynow",
          planId: "FREE",
          idLast4: idNumber.slice(-4),
        },
      });
      return {
        ok: true,
        reference: paymentReference,
        feeCents: Number(tx.amount || requiredCents),
      };
    } catch (err) {
      const { error, code, status } = paystackErrorResponse(
        err,
        "Could not verify payment"
      );
      return NextResponse.json({ error, code }, { status });
    }
  }

  // Start Paystack checkout (Free plan → R10)
  try {
    const site = getSiteUrl();
    const reference = makeReference("kyc");
    const init = await initializeTransaction({
      email,
      amountCents: requiredCents,
      reference,
      callbackUrl: `${site}/verification?kyc_paid=1&reference=${encodeURIComponent(reference)}`,
      metadata: {
        purpose: "kyc_verifynow",
        userId,
        planId: "FREE",
        idLast4: idNumber.slice(-4),
        custom_fields: [
          {
            display_name: "Product",
            variable_name: "product",
            value: `VerifyNow SA identity check (${formatZar(requiredCents)})`,
          },
        ],
      },
      channels: ["card", "apple_pay", "bank", "eft", "ussd", "qr"],
    });

    await recordPayment({
      userId,
      kind: "KYC",
      amountCents: requiredCents,
      description: `VerifyNow SA identity check · pending · ${formatZar(requiredCents)}`,
      reference,
      provider: "paystack",
      status: "PENDING",
      meta: {
        purpose: "kyc_verifynow",
        planId: "FREE",
        idLast4: idNumber.slice(-4),
      },
    });

    return NextResponse.json({
      ok: true,
      needsPayment: true,
      feeCents: requiredCents,
      feeLabel: formatZar(requiredCents),
      free: false,
      planId: "FREE",
      reference,
      url: init.authorization_url,
      message: `Pay ${formatZar(requiredCents)} with Paystack to run VerifyNow (free on Plus/Premium).`,
    });
  } catch (err) {
    const { error, code, status } = paystackErrorResponse(err);
    return NextResponse.json({ error, code }, { status });
  }
}

async function runSouthAfricaKyc(
  userId: string,
  email: string,
  body: {
    idNumber?: string;
    selfieBase64?: string;
    referenceImageBase64?: string;
    paymentReference?: string;
    checkoutOnly?: boolean;
  }
) {
  const idNumber = String(body.idNumber || "").replace(/\D/g, "");
  if (!isValidSaIdNumber(idNumber)) {
    return NextResponse.json(
      { error: "Enter a valid 13-digit South African ID number" },
      { status: 400 }
    );
  }

  const paid = await ensureVerifyNowPayment(
    userId,
    email,
    idNumber,
    body.paymentReference
  );
  if (paid instanceof NextResponse) return paid;
  if (body.checkoutOnly) {
    return NextResponse.json({
      ok: true,
      paid: true,
      reference: paid.reference,
      demo: paid.demo,
    });
  }

  const idKey = `said:${userId}:${idNumber}`;
  const idResult = await verifySaIdNumber(idNumber, idKey);
  if (!idResult.ok) {
    await prisma.verification.create({
      data: {
        userId,
        type: "ID",
        status: "REJECTED",
        notes: idResult.statusText || "SA ID verification failed",
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json(
      {
        error: idResult.statusText || "SA ID could not be verified",
        provider: isVerifyNowConfigured() ? "verifynow" : "demo",
      },
      { status: 422 }
    );
  }

  await upsertVerification(userId, "ID", "VERIFIED", {
    notes: [
      "SA ID verified via VerifyNow",
      (idResult.fullName ||
        [idResult.firstName, idResult.lastName].filter(Boolean).join(" ")) &&
        `Name: ${idResult.fullName || [idResult.firstName, idResult.lastName].filter(Boolean).join(" ")}`,
      idResult.dob && `DOB: ${idResult.dob}`,
      idResult.gender && `Gender: ${idResult.gender}`,
      idResult.citizenship && `Citizenship: ${idResult.citizenship}`,
      idResult.alive === false
        ? "⚠ Deceased status"
        : idResult.deceasedStatus
          ? `Status: ${idResult.deceasedStatus}`
          : null,
      idResult.statusText,
      isVerifyNowConfigured() ? "provider=verifynow" : "provider=demo",
      idResult.remainingCredits != null
        ? `credits_left=${idResult.remainingCredits}`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  let faceOk = true;
  let faceNotes = "Selfie not submitted";
  if (body.selfieBase64) {
    const face = await verifyFaceMatch({
      idNumber,
      selfieBase64: body.selfieBase64,
      referenceImageBase64: body.referenceImageBase64,
      idempotencyKey: `face:${userId}:${idNumber}`,
    });
    faceOk = face.ok;
    faceNotes = face.statusText || (face.ok ? "Face match OK" : "Face match failed");
    await upsertVerification(userId, "SELFIE", face.ok ? "VERIFIED" : "REJECTED", {
      notes: faceNotes,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      idNumberLast4: idNumber.slice(-4),
      kycProvider: isVerifyNowConfigured() ? "verifynow" : "demo",
      kycExternalId: idResult.requestId || null,
      kycCountry: "ZA",
      kycVerifiedAt: faceOk ? new Date() : null,
    },
  });

  // Optional: prefill name from Home Affairs if user name looks generic
  if (idResult.firstName || idResult.lastName) {
    const full = [idResult.firstName, idResult.lastName].filter(Boolean).join(" ");
    if (full.length >= 3) {
      // only set if empty-ish — don't overwrite custom display names blindly
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (u && (!u.name || u.name.length < 3 || u.name.toLowerCase() === "user")) {
        await prisma.user.update({ where: { id: userId }, data: { name: full } });
      }
    }
  }

  const isFullyVerified = await refreshUserVerifiedBadge(userId);

  return NextResponse.json({
    ok: true,
    region: "ZA",
    provider: isVerifyNowConfigured() ? "verifynow" : "demo",
    payment: {
      reference: paid.reference,
      feeCents: paid.feeCents,
      feeLabel:
        paid.complimentary
          ? "Free (Plus/Premium)"
          : paid.demo
            ? "Demo (free)"
            : formatZar(paid.feeCents),
      demo: Boolean(paid.demo),
      complimentary: Boolean(paid.complimentary),
    },
    id: {
      ok: true,
      firstName: idResult.firstName,
      lastName: idResult.lastName,
      dob: idResult.dob,
      statusText: idResult.statusText,
    },
    face: body.selfieBase64
      ? { ok: faceOk, statusText: faceNotes }
      : { ok: null, statusText: "Submit a selfie to complete face match" },
    isFullyVerified,
  });
}

async function runInternationalKyc(
  userId: string,
  email: string,
  name: string,
  country?: string
) {
  const site = getSiteUrl();
  let session;
  try {
    session = await createInternationalSession({
      userId,
      email,
      fullName: name,
      callbackUrl: `${site}/verification?kyc=didit`,
      country,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Could not start Didit verification session",
        provider: "didit",
      },
      { status: 502 }
    );
  }

  if (session.provider === "demo" || !session.url) {
    return NextResponse.json({
      ok: true,
      region: "INTERNATIONAL",
      provider: "manual",
      message:
        "International live KYC is not configured yet. Upload your passport/ID and selfie below for admin review, or set DIDIT_API_KEY + DIDIT_WORKFLOW_ID for automated global checks (see DIDIT.md).",
      manualUpload: true,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycProvider: "didit",
      kycExternalId: session.sessionId,
      kycCountry: (country || "INTL").toUpperCase().slice(0, 8),
    },
  });

  await upsertVerification(userId, "ID", "PENDING", {
    notes: `Didit session ${session.sessionId} started`,
  });
  await upsertVerification(userId, "SELFIE", "PENDING", {
    notes: `Didit liveness pending · session ${session.sessionId}`,
  });

  return NextResponse.json({
    ok: true,
    region: "INTERNATIONAL",
    provider: "didit",
    sessionId: session.sessionId,
    url: session.url,
    message: "Complete verification in the secure Didit window, then return here.",
  });
}

async function upsertVerification(
  userId: string,
  type: string,
  status: "VERIFIED" | "REJECTED" | "PENDING",
  opts: { notes?: string; documentUrl?: string }
) {
  await prisma.verification.deleteMany({
    where: {
      userId,
      type,
      status: { in: ["PENDING", "REJECTED", "UNVERIFIED"] },
    },
  });
  // Also clear prior VERIFIED of same type when re-running KYC
  await prisma.verification.deleteMany({
    where: { userId, type, status: "VERIFIED" },
  });
  return prisma.verification.create({
    data: {
      userId,
      type,
      status,
      notes: opts.notes || null,
      documentUrl: opts.documentUrl || null,
      reviewedAt: status === "PENDING" ? null : new Date(),
    },
  });
}
