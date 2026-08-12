import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageEmail } from "@/lib/email";
import { checkAndConsume } from "@/lib/entitlements";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const take = Math.min(
    Number(new URL(req.url).searchParams.get("take") || 80) || 80,
    120
  );
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, image: true, role: true } },
      userB: { select: { id: true, name: true, image: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take,
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (conversation.userAId !== session.user.id && conversation.userBId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark others' messages as read
  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: session.user.id },
      status: "SENT",
    },
    data: { status: "READ" },
  });

  const other =
    conversation.userAId === session.user.id ? conversation.userB : conversation.userA;

  // Chronological for the UI (we fetched newest-first with take)
  const messages = [...conversation.messages].reverse();

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      other,
      messages,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`message:${session.user.id}`, { limit: 40, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages — try again shortly" }, { status: 429 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, role: true } },
      userB: { select: { id: true, role: true } },
    },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (conversation.userAId !== session.user.id && conversation.userBId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let messageBody: string;
  try {
    messageBody = bodySchema.parse(await req.json()).body;
  } catch {
    return NextResponse.json(
      { error: "Invalid message (1–4000 characters required)" },
      { status: 400 }
    );
  }

  const peer =
    conversation.userA.role === "AUPAIR" && conversation.userB.role === "AUPAIR";
  const otherIdEarly =
    conversation.userAId === session.user.id
      ? conversation.userBId
      : conversation.userAId;
  const otherMessaged = await prisma.message.count({
    where: { conversationId: id, senderId: otherIdEarly },
  });
  const replyFree = otherMessaged > 0;
  if (!peer && !replyFree) {
    const limit = await checkAndConsume(session.user.id, "MESSAGE");
    if (!limit.ok) {
      // Best-effort upgrade nudge email (throttled via notification title)
      try {
        const recent = await prisma.notification.findFirst({
          where: {
            userId: session.user.id,
            title: "Message limit — upgrade",
            createdAt: { gte: new Date(Date.now() - 20 * 60 * 60 * 1000) },
          },
        });
        if (!recent) {
          await createNotification({
            userId: session.user.id,
            type: "BILLING",
            title: "Message limit — upgrade",
            body: `You've used ${limit.used}/${limit.limit} free messages. Plus starts at R99 / 2 weeks.`,
            href: "/pricing",
          });
          const me = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true },
          });
          if (me?.email) {
            const { sendUpgradeNudgeEmail } = await import("@/lib/email");
            void sendUpgradeNudgeEmail({
              toEmail: me.email,
              toName: me.name,
              used: limit.used,
              limit: limit.limit,
            }).catch(() => null);
          }
        }
      } catch {
        /* non-fatal */
      }
      return NextResponse.json(
        {
          error: limit.reason,
          upgradeRequired: true,
          limit: limit.limit,
          used: limit.used,
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      );
    }
  }

  const otherPartyId =
    conversation.userAId === session.user.id
      ? conversation.userBId
      : conversation.userAId;

  // Hard block phone/email until shortlist (or later stage)
  const {
    messageContainsContact,
    canShareContact,
    CONTACT_BLOCK_MESSAGE,
  } = await import("@/lib/contact-privacy");
  if (messageContainsContact(messageBody)) {
    const share = await canShareContact(session.user.id, otherPartyId);
    if (!share.allowed) {
      return NextResponse.json(
        {
          error: CONTACT_BLOCK_MESSAGE,
          contactLocked: true,
          unlockHint: "Shortlist this person to unlock contact sharing.",
        },
        { status: 403 }
      );
    }
  }

  const priorSent = await prisma.message.count({
    where: { senderId: session.user.id },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      body: messageBody,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  // First-ever message: in-app safety tip + funnel (once)
  if (priorSent === 0) {
    void createNotification({
      userId: session.user.id,
      type: "SYSTEM",
      title: "First message sent 👋",
      body: "Great start. Keep chats on AuPairly until you trust them, and meet first in a public place.",
      href: "/safety",
    }).catch(() => null);
    void import("@/lib/funnel").then(({ trackFunnel }) =>
      trackFunnel("first_message", { conversationId: id })
    );
  }

  const otherId =
    conversation.userAId === session.user.id
      ? conversation.userBId
      : conversation.userAId;

  // Response-time: minutes since the other person's last message
  const lastFromOther = await prisma.message.findFirst({
    where: { conversationId: id, senderId: otherId },
    orderBy: { createdAt: "desc" },
  });
  if (lastFromOther) {
    const mins = Math.max(
      1,
      Math.round((Date.now() - lastFromOther.createdAt.getTime()) / 60000)
    );
    const meUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avgResponseMinutes: true },
    });
    const prev = meUser?.avgResponseMinutes;
    const next = prev == null ? mins : Math.round(prev * 0.7 + mins * 0.3);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avgResponseMinutes: next, lastActiveAt: new Date() },
    });
  } else {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActiveAt: new Date() },
    });
  }

  // Boost analytics: count messages while either party is boosted
  const now = new Date();
  await prisma.boostEvent.updateMany({
    where: {
      userId: { in: [session.user.id, otherId] },
      endsAt: { gt: now },
    },
    data: { messages: { increment: 1 } },
  });

  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: {
      id: true,
      name: true,
      email: true,
      emailPrefMessages: true,
    },
  });

  if (other) {
    await createNotification({
      userId: other.id,
      type: "MESSAGE",
      title: `Message from ${session.user.name}`,
      body: messageBody.slice(0, 160),
      href: `/messages/${id}`,
    });
    if (other.emailPrefMessages !== "OFF") {
      void sendNewMessageEmail({
        toEmail: other.email,
        toName: other.name,
        fromName: session.user.name,
        preview: messageBody,
        conversationId: id,
      }).catch((e) => console.error("[email] message", e));
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
