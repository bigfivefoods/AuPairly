import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  targetId: z.string().min(1),
  reason: z.string().min(3).max(120),
  details: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`report:${session.user.id}:${clientIp(req)}`, {
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many reports" }, { status: 429 });
  }

  try {
    const body = schema.parse(await req.json());
    if (body.targetId === session.user.id) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetId: body.targetId,
        reason: body.reason,
        details: body.details?.trim() || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }
}
