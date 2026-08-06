import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageEmail } from "@/lib/email";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, image: true, role: true } },
      userB: { select: { id: true, name: true, image: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
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

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      other,
      messages: conversation.messages,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (conversation.userAId !== session.user.id && conversation.userBId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const messageBody = (body.body as string)?.trim();
  if (!messageBody) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

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

  const otherId =
    conversation.userAId === session.user.id
      ? conversation.userBId
      : conversation.userAId;
  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, email: true },
  });

  if (other) {
    await createNotification({
      userId: other.id,
      type: "MESSAGE",
      title: `Message from ${session.user.name}`,
      body: messageBody.slice(0, 160),
      href: `/messages/${id}`,
    });
    void sendNewMessageEmail({
      toEmail: other.email,
      toName: other.name,
      fromName: session.user.name,
      preview: messageBody,
      conversationId: id,
    }).catch((e) => console.error("[email] message", e));
  }

  return NextResponse.json({ message }, { status: 201 });
}
