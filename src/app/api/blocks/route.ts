import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(["block", "unblock"]).default("block"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: session.user.id },
    include: {
      blocked: { select: { id: true, name: true, image: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ blocks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`block:${session.user.id}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = schema.parse(await req.json());
    if (body.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    if (body.action === "unblock") {
      await prisma.userBlock.deleteMany({
        where: { blockerId: session.user.id, blockedId: body.userId },
      });
      return NextResponse.json({ ok: true, blocked: false });
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: body.userId,
        },
      },
      create: {
        blockerId: session.user.id,
        blockedId: body.userId,
      },
      update: {},
    });

    return NextResponse.json({ ok: true, blocked: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("block POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
