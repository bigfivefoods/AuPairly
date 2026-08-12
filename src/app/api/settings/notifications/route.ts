import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const pref = String(body.emailPrefMessages || "INSTANT").toUpperCase();
  if (!["INSTANT", "DAILY", "OFF"].includes(pref)) {
    return NextResponse.json({ error: "Invalid email preference" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      emailPrefMessages: pref,
      whatsappAlerts: Boolean(body.whatsappAlerts),
      phone:
        body.phone !== undefined
          ? String(body.phone || "").trim().slice(0, 40) || null
          : undefined,
    },
    select: {
      emailPrefMessages: true,
      whatsappAlerts: true,
      phone: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
