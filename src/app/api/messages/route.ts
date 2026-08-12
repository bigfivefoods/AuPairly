import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageEmail } from "@/lib/email";
import { checkAndConsume } from "@/lib/entitlements";
import { rateLimit } from "@/lib/rate-limit";

const postSchema = z.object({
  recipientId: z.string().min(1).max(64),
  body: z.string().trim().min(1).max(4000),
});

/** True when both parties are AUPAIR (AuPair Connect peer chat). */
async function isPeerConversation(userId: string, otherId: string) {
  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: otherId }, select: { role: true } }),
  ]);
  return a?.role === "AUPAIR" && b?.role === "AUPAIR";
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, name: true, image: true, role: true } },
      userB: { select: { id: true, name: true, image: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  const items = conversations.map((c) => {
    const other = c.userAId === userId ? c.userB : c.userA;
    return {
      id: c.id,
      other,
      lastMessage: c.messages[0] ?? null,
      lastMessageAt: c.lastMessageAt,
    };
  });

  return NextResponse.json({ conversations: items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`message:${session.user.id}`, { limit: 40, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages — try again shortly" }, { status: 429 });
  }

  let recipientId: string;
  let messageBody: string;
  try {
    const parsed = postSchema.parse(await req.json());
    recipientId = parsed.recipientId;
    messageBody = parsed.body;
  } catch {
    return NextResponse.json(
      { error: "Invalid message (1–4000 characters required)" },
      { status: 400 }
    );
  }

  if (recipientId === session.user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  const { isBlockedEitherWay } = await import("@/lib/blocks");
  if (await isBlockedEitherWay(session.user.id, recipientId)) {
    return NextResponse.json(
      { error: "You can’t message this user (blocked)." },
      { status: 403 }
    );
  }

  // Peer chats free; replies free once the other person has messaged (smarter free-tier paywall)
  const peer = await isPeerConversation(session.user.id, recipientId);
  const [userAId, userBId] =
    session.user.id < recipientId
      ? [session.user.id, recipientId]
      : [recipientId, session.user.id];
  let conversation = await prisma.conversation.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  let replyFree = false;
  if (conversation) {
    const otherMessaged = await prisma.message.count({
      where: { conversationId: conversation.id, senderId: recipientId },
    });
    replyFree = otherMessaged > 0;
  }
  if (!peer && !replyFree) {
    const limit = await checkAndConsume(session.user.id, "MESSAGE");
    if (!limit.ok) {
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

  // Hard block phone/email until shortlist (or later stage)
  const {
    messageContainsContact,
    canShareContact,
    CONTACT_BLOCK_MESSAGE,
  } = await import("@/lib/contact-privacy");
  if (messageContainsContact(messageBody)) {
    const share = await canShareContact(session.user.id, recipientId);
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

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userAId, userBId },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      body: messageBody,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  await createNotification({
    userId: recipient.id,
    type: "MESSAGE",
    title: `Message from ${session.user.name}`,
    body: messageBody.slice(0, 160),
    href: `/messages/${conversation.id}`,
  });

  if (recipient.emailPrefMessages !== "OFF") {
    void sendNewMessageEmail({
      toEmail: recipient.email,
      toName: recipient.name,
      fromName: session.user.name,
      preview: messageBody,
      conversationId: conversation.id,
    }).catch((e) => console.error("[email] message", e));
  }

  const priorSent = await prisma.message.count({
    where: { senderId: session.user.id },
  });
  if (priorSent <= 1) {
    void import("@/lib/funnel").then(({ trackFunnel }) =>
      trackFunnel("first_message", { conversationId: conversation.id })
    );
  }

  return NextResponse.json({ conversationId: conversation.id, message }, { status: 201 });
}
