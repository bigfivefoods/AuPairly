import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/entitlements";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await getUserPlan(session.user.id);
  if (planId === "FREE" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      {
        error: "Priority support is for Plus/Premium members. Upgrade to open a ticket.",
        upgradeRequired: true,
      },
      { status: 402 }
    );
  }

  const body = await req.json();
  const subject = String(body.subject || "").trim();
  const text = String(body.body || "").trim();
  if (!subject || !text) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject,
      body: text,
    },
  });
  return NextResponse.json({ ticket });
}
