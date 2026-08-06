import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["AUPAIR", "PARENT"]),
});

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, { limit: 8, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many signups from this network. Try again in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        role: data.role,
        ...(data.role === "AUPAIR"
          ? {
              aupairProfile: {
                create: {
                  headline: `${data.name.split(" ")[0]} — trusted care`,
                  status: "DRAFT",
                  services: '["CHILDCARE"]',
                },
              },
            }
          : {
              familyProfile: {
                create: {
                  familyName: `${data.name.split(" ")[0]} Family`,
                  headline: `Looking for trusted care`,
                  status: "DRAFT",
                  services: '["CHILDCARE"]',
                },
              },
            }),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await createNotification({
      userId: user.id,
      type: "SYSTEM",
      title: "Welcome to AuPairly",
      body: "Pick your services and city — takes under 2 minutes.",
      href: "/onboarding",
    });

    void sendWelcomeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
    }).catch((e) => console.error("[email] welcome", e));

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
