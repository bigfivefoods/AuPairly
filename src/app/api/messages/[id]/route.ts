import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendNewMessageEmail } from "@/lib/email";
import { checkAndConsume } from "@/lib/entitlements";

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
