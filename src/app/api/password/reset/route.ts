import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const rl = rateLimit(`reset:${clientIp(req)}`, { limit: 10, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = schema.parse(await req.json());
    const tokenHash = createHash("sha256").update(body.token).digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    // Invalidate other unused tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: record.email, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ ok: true, message: "Password updated. You can log in now." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
