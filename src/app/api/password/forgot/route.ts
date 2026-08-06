import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const rl = rateLimit(`forgot:${clientIp(req)}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    // Always return success to avoid email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email, token: tokenHash, expiresAt },
      });

      const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || "http://localhost:3000";
      const resetUrl = `${base}/reset-password?token=${rawToken}`;

      await sendEmail({
        to: email,
        subject: "Reset your AuPairly password",
        text: `Hi ${user.name},\n\nReset your password with this link (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.\n\n— AuPairly`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
