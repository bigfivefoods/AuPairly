import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const users = await prisma.user.findMany({
    where: { id: { in: stories.map((s) => s.userId) } },
    select: { id: true, name: true, image: true, role: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return NextResponse.json({
    stories: stories.map((s) => ({ ...s, user: byId[s.userId] })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const text = String(body.body || "").trim();
  if (text.length < 3 || text.length > 280) {
    return NextResponse.json({ error: "Story must be 3–280 characters" }, { status: 400 });
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const story = await prisma.story.create({
    data: { userId: session.user.id, body: text, expiresAt },
  });
  return NextResponse.json({ story });
}
