/**
 * POST /api/verification/kyc
 *
 * South Africa (VerifyNow):
 *   { country: "ZA", idNumber, selfieBase64?, referenceImageBase64? }
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
  isDiditConfigured,
} from "@/lib/kyc/didit";
import { getSiteUrl } from "@/lib/paystack";
import { randomUUID } from "node:crypto";

export async function GET() {
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
  return NextResponse.json({
    providers: kycProvidersStatus(),
    user,
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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const region = resolveKycRegion(body.country);
  const userId = session.user.id;

  if (region === "ZA") {
    return runSouthAfricaKyc(userId, body);
  }

  return runInternationalKyc(userId, session.user.email || "", session.user.name || "User", body.country);
}

async function runSouthAfricaKyc(
  userId: string,
  body: {
    idNumber?: string;
    selfieBase64?: string;
    referenceImageBase64?: string;
  }
) {
  const idNumber = String(body.idNumber || "").replace(/\D/g, "");
  if (!isValidSaIdNumber(idNumber)) {
    return NextResponse.json(
      { error: "Enter a valid 13-digit South African ID number" },
      { status: 400 }
    );
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
      "SA ID verified",
      idResult.firstName && `Name: ${idResult.firstName} ${idResult.lastName || ""}`.trim(),
      idResult.dob && `DOB: ${idResult.dob}`,
      idResult.statusText,
      isVerifyNowConfigured() ? "provider=verifynow" : "provider=demo",
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
  const session = await createInternationalSession({
    userId,
    email,
    fullName: name,
    callbackUrl: `${site}/verification?kyc=didit`,
  });

  if (session.provider === "demo" || !session.url) {
    return NextResponse.json({
      ok: true,
      region: "INTERNATIONAL",
      provider: "manual",
      message:
        "International live KYC is not configured yet. Upload your passport/ID and selfie below for admin review, or set DIDIT_API_KEY for automated global checks.",
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

  return NextResponse.json({
    ok: true,
    region: "INTERNATIONAL",
    provider: "didit",
    sessionId: session.sessionId,
    url: session.url,
    message: "Complete verification in the secure window, then return here.",
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
