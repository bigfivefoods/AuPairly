import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(["suspend", "unsuspend"]),
  reason: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    if (body.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot suspend yourself" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, role: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot suspend admins" }, { status: 400 });
    }

    if (body.action === "suspend") {
      await prisma.user.update({
        where: { id: body.userId },
        data: {
          suspendedAt: new Date(),
          suspendReason: body.reason?.trim() || "Policy violation",
        },
      });
      // Unpublish listings
      await prisma.auPairProfile.updateMany({
        where: { userId: body.userId },
        data: { status: "DRAFT" },
      });
      await prisma.familyProfile.updateMany({
        where: { userId: body.userId },
        data: { status: "DRAFT" },
      });
      await createNotification({
        userId: body.userId,
        type: "SYSTEM",
        title: "Account suspended",
        body:
          body.reason?.trim() ||
          "Your account was suspended for a policy review. Contact support if this is a mistake.",
        href: "/support",
      }).catch(() => null);
    } else {
      await prisma.user.update({
        where: { id: body.userId },
        data: { suspendedAt: null, suspendReason: null },
      });
      await createNotification({
        userId: body.userId,
        type: "SYSTEM",
        title: "Account reinstated",
        body: "Your AuPairly account is active again. You can republish your listing anytime.",
        href: "/dashboard",
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, action: body.action });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("[admin users]", e);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
