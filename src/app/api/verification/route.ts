import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoVerifyEnabled, refreshUserVerifiedBadge } from "@/lib/verification";
import { rateLimit } from "@/lib/rate-limit";

const TYPES = ["ID", "BACKGROUND", "ADDRESS", "REFERENCES", "SELFIE"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const verifications = await prisma.verification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ verifications });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`verify:${session.user.id}`, { limit: 15, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
  }

  const body = await req.json();
  const type = body.type as string;
  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });
  }

  // Replace prior pending/rejected of same type
  await prisma.verification.deleteMany({
    where: {
      userId: session.user.id,
      type,
      status: { in: ["PENDING", "REJECTED", "UNVERIFIED"] },
    },
  });

  const auto = autoVerifyEnabled();

  let verification = await prisma.verification.create({
    data: {
      userId: session.user.id,
      type,
      status: auto ? "VERIFIED" : "PENDING",
      documentUrl: body.documentUrl ?? null,
      notes: auto
        ? "Auto-verified (demo mode). Set AUTO_VERIFY=false for admin review."
        : body.notes ?? "Submitted for admin review.",
      reviewedAt: auto ? new Date() : null,
    },
  });

  const isFullyVerified = await refreshUserVerifiedBadge(session.user.id);

  if (!auto && verification.status === "PENDING") {
    void import("@/lib/notify-management").then(({ notifyManagement }) =>
      notifyManagement({
        subject: `Verification pending: ${type}`,
        title: "New verification to review",
        body: `${session.user!.name} (${session.user!.email}) submitted ${type} for admin review.`,
        href: "/admin",
        ctaLabel: "Review queue",
      })
    );
  }

  return NextResponse.json({
    verification,
    isFullyVerified,
    pendingReview: !auto && verification.status === "PENDING",
  });
}
