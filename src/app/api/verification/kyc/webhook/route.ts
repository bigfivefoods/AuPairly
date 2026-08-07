/**
 * POST /api/verification/kyc/webhook
 * Didit v3 completion webhook (status.updated / data.updated).
 *
 * Register destination:
 *   url: https://www.aupairly.me/api/verification/kyc/webhook
 *   events: status.updated, data.updated
 *   store secret_shared_key as DIDIT_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshUserVerifiedBadge } from "@/lib/verification";
import {
  diditStatusOutcome,
  verifyDiditWebhookSignature,
} from "@/lib/kyc/didit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyDiditWebhookSignature(raw, {
    signatureV2: req.headers.get("x-signature-v2"),
    signature: req.headers.get("x-signature"),
    signatureSimple: req.headers.get("x-signature-simple"),
    timestamp: req.headers.get("x-timestamp"),
  });
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const webhookType = String(payload.webhook_type || "");
  // Only process session status/data events for KYC
  if (
    webhookType &&
    webhookType !== "status.updated" &&
    webhookType !== "data.updated"
  ) {
    return NextResponse.json({ ok: true, ignored: webhookType });
  }

  const vendorData = String(
    payload.vendor_data || payload.vendorData || payload.user_id || ""
  );
  const status = String(payload.status || "");
  const sessionId = String(payload.session_id || payload.id || "");
  const outcome = diditStatusOutcome(status);

  if (outcome === "ignore") {
    return NextResponse.json({ ok: true, ignored: status || "no-status" });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(vendorData ? [{ id: vendorData }] : []),
        ...(sessionId ? [{ kycExternalId: sessionId }] : []),
      ],
    },
    select: { id: true },
  });
  if (!user) {
    // Acknowledge so Didit does not retry forever for unknown users
    return NextResponse.json({ ok: true, warning: "User not found" });
  }

  const vStatus = outcome; // VERIFIED | REJECTED | PENDING
  for (const type of ["ID", "SELFIE"] as const) {
    await prisma.verification.deleteMany({
      where: { userId: user.id, type },
    });
    await prisma.verification.create({
      data: {
        userId: user.id,
        type,
        status: vStatus,
        notes: `Didit ${webhookType || "webhook"}: ${status || "unknown"} · session ${sessionId}`,
        reviewedAt: vStatus === "PENDING" ? null : new Date(),
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      kycProvider: "didit",
      kycExternalId: sessionId || undefined,
      kycVerifiedAt: outcome === "VERIFIED" ? new Date() : null,
    },
  });

  await refreshUserVerifiedBadge(user.id);

  return NextResponse.json({ ok: true, outcome, status });
}
