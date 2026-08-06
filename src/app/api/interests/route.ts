import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendInterestEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  toUserId: z.string().min(1),
  message: z.string().max(2000).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const box = searchParams.get("box") || "received"; // received | sent

  const interests = await prisma.interest.findMany({
    where:
      box === "sent"
        ? { fromUserId: session.user.id }
        : { toUserId: session.user.id },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          aupairProfile: { select: { id: true, headline: true, isVerified: true } },
          familyProfile: { select: { id: true, familyName: true, headline: true, isVerified: true } },
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          aupairProfile: { select: { id: true, headline: true, isVerified: true } },
          familyProfile: { select: { id: true, familyName: true, headline: true, isVerified: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ interests });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`interest:${session.user.id}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = createSchema.parse(await req.json());
    if (body.toUserId === session.user.id) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    const toUser = await prisma.user.findUnique({
      where: { id: body.toUserId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!toUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parents apply to au pairs; au pairs apply to parents
    const fromRole = session.user.role;
    if (fromRole === "PARENT" && toUser.role !== "AUPAIR") {
      return NextResponse.json({ error: "Parents can only apply to au pairs" }, { status: 400 });
    }
    if (fromRole === "AUPAIR" && toUser.role !== "PARENT") {
      return NextResponse.json({ error: "Au pairs can only apply to families" }, { status: 400 });
    }

    const interest = await prisma.interest.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: session.user.id,
          toUserId: body.toUserId,
        },
      },
      create: {
        fromUserId: session.user.id,
        toUserId: body.toUserId,
        message: body.message?.trim() || null,
        status: "PENDING",
      },
      update: {
        message: body.message?.trim() || null,
        status: "PENDING",
      },
    });

    await createNotification({
      userId: toUser.id,
      type: "INTEREST",
      title: "New match interest",
      body: `${session.user.name} expressed interest in matching with you.`,
      href: "/interests",
      meta: { interestId: interest.id, fromUserId: session.user.id },
    });

    void sendInterestEmail({
      toEmail: toUser.email,
      toName: toUser.name,
      fromName: session.user.name,
      message: body.message,
      interestId: interest.id,
    }).catch((e) => console.error("[email] interest", e));

    return NextResponse.json({ interest }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not send interest" }, { status: 500 });
  }
}
