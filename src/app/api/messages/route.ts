import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageEmail } from "@/lib/email";

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

  const body = await req.json();
  const recipientId = body.recipientId as string;
  const messageBody = (body.body as string)?.trim();

  if (!recipientId || !messageBody) {
    return NextResponse.json({ error: "recipientId and body are required" }, { status: 400 });
  }

  if (recipientId === session.user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  // Canonical order for unique pair
  const [userAId, userBId] =
    session.user.id < recipientId
      ? [session.user.id, recipientId]
      : [recipientId, session.user.id];

  let conversation = await prisma.conversation.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });

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

  void sendNewMessageEmail({
    toEmail: recipient.email,
    toName: recipient.name,
    fromName: session.user.name,
    preview: messageBody,
    conversationId: conversation.id,
  }).catch((e) => console.error("[email] message", e));

  return NextResponse.json({ conversationId: conversation.id, message }, { status: 201 });
}
