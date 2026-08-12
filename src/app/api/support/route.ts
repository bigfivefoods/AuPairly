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

  const body = await req.json();
  const subject = String(body.subject || "").trim().slice(0, 200);
  const text = String(body.body || "").trim().slice(0, 5000);
  const category = String(body.category || "GENERAL").toUpperCase();
  if (!subject || !text) {
    return NextResponse.json({ error: "subject and body required" }, { status: 400 });
  }

  // Free users can open safety/account tickets; priority topics stay paid
  const freeAllowed = new Set(["SAFETY", "ABUSE", "ACCOUNT_ACCESS", "REPORT"]);
  const { planId } = await getUserPlan(session.user.id);
  if (
    planId === "FREE" &&
    session.user.role !== "ADMIN" &&
    !freeAllowed.has(category)
  ) {
    return NextResponse.json(
      {
        error:
          "Priority support is for Plus/Premium. Free accounts can still report safety or account issues — pick category Safety / Abuse / Account.",
        upgradeRequired: true,
        freeCategories: [...freeAllowed],
      },
      { status: 402 }
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject: freeAllowed.has(category) ? `[${category}] ${subject}` : subject,
      body: text,
    },
  });

  void import("@/lib/notify-management").then(({ notifyManagement }) =>
    notifyManagement({
      subject: `Support: ${ticket.subject}`,
      title: "New support ticket",
      body: `From: ${session.user!.name} (${session.user!.email})\nCategory: ${category}\nSubject: ${ticket.subject}\n\n${text.slice(0, 800)}`,
      href: "/manage",
      ctaLabel: "Open management",
    })
  );

  return NextResponse.json({ ticket });
}
