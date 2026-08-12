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

async function processVerification(
  id: string,
  action: "approve" | "reject",
  notes: string | undefined,
  adminEmail: string
) {
  const existing = await prisma.verification.findUnique({ where: { id } });
  if (!existing || existing.status !== "PENDING") {
    return { ok: false as const, error: "Not found or not pending", id };
  }

  const reason =
    notes?.trim() ||
    (action === "approve"
      ? `Approved by admin ${adminEmail}`
      : `Rejected by admin ${adminEmail}`);

  if (action === "reject" && !notes?.trim()) {
    return {
      ok: false as const,
      error: "Rejection reason required",
      id,
    };
  }

  const verification = await prisma.verification.update({
    where: { id },
    data: {
      status: action === "approve" ? "VERIFIED" : "REJECTED",
      reviewedAt: new Date(),
      notes: reason,
    },
  });

  const isFullyVerified = await refreshUserVerifiedBadge(existing.userId);

  const member = await prisma.user.findUnique({
    where: { id: existing.userId },
    select: { email: true, name: true },
  });
  if (member) {
    const { createNotification } = await import("@/lib/notifications");
    await createNotification({
      userId: existing.userId,
      type: "SYSTEM",
      title:
        action === "approve"
          ? "Verification approved"
          : "Verification needs attention",
      body:
        action === "approve"
          ? `Your ${existing.type.replace(/_/g, " ")} check was approved.`
          : `Your ${existing.type.replace(/_/g, " ")} check was not approved. ${reason}`,
      href: "/verification",
    }).catch(() => null);

    if (member.email) {
      const { sendVerificationResultEmail } = await import("@/lib/email");
      void sendVerificationResultEmail({
        toEmail: member.email,
        toName: member.name || "there",
        type: existing.type,
        approved: action === "approve",
        notes: notes || null,
      }).catch((e) => console.error("[email] verification result", e));
    }
  }

  return { ok: true as const, verification, isFullyVerified, id };
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const action = body.action as "approve" | "reject";
  const notes = (body.notes as string) || undefined;

  // Bulk: { ids: string[], action, notes }
  if (Array.isArray(body.ids) && body.ids.length > 0) {
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }
    if (action === "reject" && !notes?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason required for bulk reject" },
        { status: 400 }
      );
    }
    const ids = body.ids.map(String).slice(0, 50);
    const results = [];
    for (const id of ids) {
      results.push(await processVerification(id, action, notes, admin.email || "admin"));
    }
    const ok = results.filter((r) => r.ok).length;
    return NextResponse.json({ ok: true, processed: ok, results });
  }

  const id = body.id as string;
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  const result = await processVerification(id, action, notes, admin.email || "admin");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
