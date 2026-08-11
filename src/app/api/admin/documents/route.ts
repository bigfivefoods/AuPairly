import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessManagement } from "@/lib/management";

/**
 * App-owner only: list secure vault documents (first aid, passport, CV, etc.).
 * Members never see other users' document URLs on public profiles.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessManagement(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = new URL(req.url).searchParams.get("userId");
  const where = userId ? { userId } : {};

  const docs = await prisma.secureDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      url: d.url,
      expiresAt: d.expiresAt,
      ownerOnly: d.ownerOnly,
      createdAt: d.createdAt,
      user: d.user,
    })),
  });
}
