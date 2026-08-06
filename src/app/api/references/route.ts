import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeSafetyScore } from "@/lib/safety";
import { getSiteUrl } from "@/lib/paystack";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const aboutMe = await prisma.referenceRequest.findMany({
    where: { subjectId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const requested = await prisma.referenceRequest.findMany({
    where: { requesterId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ aboutMe, requested });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const refereeEmail = String(body.refereeEmail || "").trim().toLowerCase();
  const refereeName = body.refereeName ? String(body.refereeName) : null;
  if (!refereeEmail.includes("@")) {
    return NextResponse.json({ error: "Valid refereeEmail required" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const ref = await prisma.referenceRequest.create({
    data: {
      requesterId: session.user.id,
      subjectId: session.user.id,
      refereeEmail,
      refereeName,
      token,
    },
  });

  const link = `${getSiteUrl()}/references/submit/${token}`;
  // Email would go via Resend if configured — return link for demo
  return NextResponse.json({
    reference: ref,
    submitUrl: link,
    message: "Share this link with your referee (email delivery when Resend is configured).",
  });
}

/** Admin/system: recompute placement verified after refs */
export async function PATCH() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const score = await recomputeSafetyScore(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { placementVerified: true, safetyScore: true, videoIntroUrl: true },
  });
  return NextResponse.json({ score, ...user });
}
