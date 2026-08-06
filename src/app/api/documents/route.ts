import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const docs = await prisma.secureDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const type = String(body.type || "OTHER");
  const url = String(body.url || "").trim();
  const label = body.label ? String(body.label) : null;
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const doc = await prisma.secureDocument.create({
    data: {
      userId: session.user.id,
      type,
      url,
      label,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });
  return NextResponse.json({ document: doc });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.secureDocument.deleteMany({
    where: { id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
