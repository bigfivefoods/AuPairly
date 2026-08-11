import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshUserVerifiedBadge } from "@/lib/verification";
import { canAccessManagement } from "@/lib/management";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (!canAccessManagement(session.user)) return null;
  return session.user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pending = await prisma.verification.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ pending, reports });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = body.id as string;
  const action = body.action as "approve" | "reject";
  const notes = (body.notes as string) || undefined;

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const existing = await prisma.verification.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const verification = await prisma.verification.update({
    where: { id },
    data: {
      status: action === "approve" ? "VERIFIED" : "REJECTED",
      reviewedAt: new Date(),
      notes:
        notes ||
        (action === "approve"
          ? `Approved by admin ${admin.email}`
          : `Rejected by admin ${admin.email}`),
    },
  });

  const isFullyVerified = await refreshUserVerifiedBadge(existing.userId);

  const member = await prisma.user.findUnique({
    where: { id: existing.userId },
    select: { email: true, name: true },
  });
  if (member?.email) {
    const { sendVerificationResultEmail } = await import("@/lib/email");
    void sendVerificationResultEmail({
      toEmail: member.email,
      toName: member.name || "there",
      type: existing.type,
      approved: action === "approve",
      notes: notes || null,
    }).catch((e) => console.error("[email] verification result", e));
  }

  return NextResponse.json({ verification, isFullyVerified });
}
