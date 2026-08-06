import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      userId,
      endDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json({ slots });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const kind = (body.kind as string) || "FREE";
  if (!["FREE", "BUSY", "NEED_COVER"].includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const slot = await prisma.availabilitySlot.create({
    data: {
      userId: session.user.id,
      kind,
      startDate,
      endDate,
      note: body.note || null,
    },
  });
  return NextResponse.json({ slot });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.availabilitySlot.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
