import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessManagement } from "@/lib/management";

/**
 * CSV export of members for outreach (owner / admin only).
 * GET /api/admin/export/users
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessManagement(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["AUPAIR", "PARENT"] } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
      emailVerified: true,
      lastActiveAt: true,
      suspendedAt: true,
      aupairProfile: {
        select: { city: true, country: true, status: true, isVerified: true },
      },
      familyProfile: {
        select: { city: true, country: true, status: true, isVerified: true },
      },
    },
  });

  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = [
    "id",
    "name",
    "email",
    "role",
    "plan",
    "city",
    "country",
    "listingStatus",
    "verified",
    "emailVerified",
    "lastActiveAt",
    "suspendedAt",
    "createdAt",
  ].join(",");

  const lines = users.map((u) => {
    const p = u.aupairProfile || u.familyProfile;
    return [
      esc(u.id),
      esc(u.name),
      esc(u.email),
      esc(u.role),
      esc(u.plan),
      esc(p?.city),
      esc(p?.country),
      esc(p?.status),
      esc(p?.isVerified ? "yes" : "no"),
      esc(u.emailVerified ? "yes" : "no"),
      esc(u.lastActiveAt?.toISOString()),
      esc(u.suspendedAt?.toISOString()),
      esc(u.createdAt.toISOString()),
    ].join(",");
  });

  const csv = [header, ...lines].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aupairly-users-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
