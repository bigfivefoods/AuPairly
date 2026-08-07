import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(120),
  city: z.string().min(1).max(80),
  slug: z.string().max(80).optional().nullable(),
  role: z.enum(["PARENT", "AUPAIR", "BOTH"]).optional().nullable(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`waitlist:${clientIp(req)}`, { limit: 12, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const city = body.city.trim();

    await prisma.cityWaitlist.upsert({
      where: {
        email_city: { email, city },
      },
      create: {
        email,
        city,
        slug: body.slug || null,
        role: body.role || "BOTH",
      },
      update: {
        slug: body.slug || null,
        role: body.role || "BOTH",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("[waitlist]", e);
    return NextResponse.json({ error: "Could not join waitlist" }, { status: 500 });
  }
}
