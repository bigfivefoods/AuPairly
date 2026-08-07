/**
 * POST /api/verification/kyc
 *
 * South Africa (VerifyNow):
 *   { country: "ZA", idNumber, selfieBase64?, referenceImageBase64?, paymentReference? }
 *   Requires Paystack payment of R69 (KYC_VERIFYNOW_FEE_CENTS) when Paystack is configured.
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

/** VerifyNow SA automated check fee (R69 default). */
export const KYC_VERIFYNOW_FEE_CENTS = Number(
  process.env.KYC_VERIFYNOW_FEE_CENTS || "6900"
);

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

  return NextResponse.json({
    providers: kycProvidersStatus(),
    verifynow: {
      mode: process.env.VERIFYNOW_MODE === "production" ? "production" : "sandbox",
      credits,
      feeCents: KYC_VERIFYNOW_FEE_CENTS,
      feeLabel: formatZar(KYC_VERIFYNOW_FEE_CENTS),
      paystackRequired: isPaystackConfigured(),
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
 * Ensure R69 Paystack payment for VerifyNow. Returns:
 * - { ok: true, reference } when paid
 * - NextResponse for checkout redirect / errors
 */
async function ensureVerifyNowPayment(
  userId: string,
  email: string,
  idNumber: string,
  paymentReference?: string
): Promise<{ ok: true; reference: string; demo?: boolean } | NextResponse> {
  // Free path when Paystack is not configured (local/demo)
  if (!isPaystackConfigured()) {
    const ref = `demo_kyc_${userId}_${Date.now()}`;
    await recordPayment({
      userId,
      kind: "KYC",
      amountCents: 0,
      description: "Demo VerifyNow KYC (Paystack not configured)",
      provider: "demo",
      reference: ref,
      meta: { demo: true, idLast4: idNumber.slice(-4) },
    });
    return { ok: true, reference: ref, demo: true };
  }

  if (!email) {
    return NextResponse.json(
      { error: "Email is required to pay for identity verification" },
      { status: 400 }
    );
  }

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
      existing.amountCents >= KYC_VERIFYNOW_FEE_CENTS
    ) {
      return { ok: true, reference: paymentReference };
    }

    try {
      const tx = await verifyTransaction(paymentReference);
      if (tx.status !== "success") {
        return NextResponse.json(
          { error: "Payment not completed yet. Finish Paystack checkout, then try again." },
          { status: 402 }
        );
      }
      if (Number(tx.amount) < KYC_VERIFYNOW_FEE_CENTS) {
        return NextResponse.json(
          { error: `Payment amount too low. VerifyNow costs ${formatZar(KYC_VERIFYNOW_FEE_CENTS)}.` },
          { status: 402 }
        );
      }
      const meta =
        typeof tx.metadata === "object" && tx.metadata
          ? (tx.metadata as Record<string, unknown>)
          : {};
      if (meta.userId && String(meta.userId) !== userId) {
        return NextResponse.json({ error: "Payment belongs to another account" }, { status: 403 });
      }
      if (meta.purpose && String(meta.purpose) !== "kyc_verifynow") {
        return NextResponse.json({ error: "Payment is not for identity verification" }, { status: 400 });
      }

      await recordPayment({
        userId,
        kind: "KYC",
        amountCents: Number(tx.amount || KYC_VERIFYNOW_FEE_CENTS),
        currency: String(tx.currency || "ZAR").toUpperCase(),
        description: `VerifyNow SA identity check · ${formatZar(KYC_VERIFYNOW_FEE_CENTS)}`,
        reference: paymentReference,
        provider: "paystack",
        meta: { purpose: "kyc_verifynow", idLast4: idNumber.slice(-4) },
      });
      return { ok: true, reference: paymentReference };
    } catch (err) {
      const { error, code, status } = paystackErrorResponse(err, "Could not verify payment");
      return NextResponse.json({ error, code }, { status });
    }
  }

  // Start Paystack checkout for R69
  try {
    const site = getSiteUrl();
    const reference = makeReference("kyc");
    const init = await initializeTransaction({
      email,
      amountCents: KYC_VERIFYNOW_FEE_CENTS,
      reference,
      callbackUrl: `${site}/verification?kyc_paid=1&reference=${encodeURIComponent(reference)}`,
      metadata: {
        purpose: "kyc_verifynow",
        userId,
        idLast4: idNumber.slice(-4),
        custom_fields: [
          {
            display_name: "Product",
            variable_name: "product",
            value: "VerifyNow SA identity check",
          },
        ],
      },
      channels: ["card", "apple_pay", "bank", "eft", "ussd", "qr"],
    });

    await recordPayment({
      userId,
      kind: "KYC",
      amountCents: KYC_VERIFYNOW_FEE_CENTS,
      description: `VerifyNow SA identity check · pending · ${formatZar(KYC_VERIFYNOW_FEE_CENTS)}`,
      reference,
      provider: "paystack",
      status: "PENDING",
      meta: { purpose: "kyc_verifynow", idLast4: idNumber.slice(-4) },
    });

    return NextResponse.json({
      ok: true,
      needsPayment: true,
      feeCents: KYC_VERIFYNOW_FEE_CENTS,
      feeLabel: formatZar(KYC_VERIFYNOW_FEE_CENTS),
      reference,
      url: init.authorization_url,
      message: `Pay ${formatZar(KYC_VERIFYNOW_FEE_CENTS)} securely with Paystack to run VerifyNow.`,
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
      feeCents: paid.demo ? 0 : KYC_VERIFYNOW_FEE_CENTS,
      feeLabel: paid.demo ? "Demo (free)" : formatZar(KYC_VERIFYNOW_FEE_CENTS),
      demo: Boolean(paid.demo),
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
