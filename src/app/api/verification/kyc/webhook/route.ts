/**
 * POST /api/verification/kyc/webhook
 * Didit (or other international) completion webhook.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshUserVerifiedBadge } from "@/lib/verification";
import { verifyDiditWebhookSignature } from "@/lib/kyc/didit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature =
    req.headers.get("x-signature") ||
    req.headers.get("x-didit-signature") ||
    req.headers.get("authorization");

  if (!verifyDiditWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const vendorData = String(
    payload.vendor_data || payload.vendorData || payload.user_id || ""
  );
  const status = String(
    payload.status || payload.decision || payload.verification_status || ""
  ).toLowerCase();
  const sessionId = String(payload.session_id || payload.id || "");

  if (!vendorData) {
    return NextResponse.json({ error: "Missing vendor_data / user id" }, { status: 400 });
  }

  const passed =
    status.includes("approv") ||
    status === "verified" ||
    status === "success" ||
    status === "pass";

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id: vendorData }, { kycExternalId: sessionId || undefined }],
    },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const vStatus = passed ? "VERIFIED" : "REJECTED";
  for (const type of ["ID", "SELFIE"] as const) {
    await prisma.verification.deleteMany({
      where: { userId: user.id, type },
    });
    await prisma.verification.create({
      data: {
        userId: user.id,
        type,
        status: vStatus,
        notes: `Didit webhook: ${status || "unknown"} · session ${sessionId}`,
        reviewedAt: new Date(),
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      kycProvider: "didit",
      kycExternalId: sessionId || undefined,
      kycVerifiedAt: passed ? new Date() : null,
    },
  });

  await refreshUserVerifiedBadge(user.id);

  return NextResponse.json({ ok: true, passed });
}
