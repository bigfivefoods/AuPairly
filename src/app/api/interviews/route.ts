import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { interviewSystemMessage } from "@/lib/icebreakers";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.userAId !== session.user.id && conv.userBId !== session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const proposals = await prisma.interviewProposal.findMany({
    where: { conversationId },
    orderBy: { proposedAt: "asc" },
  });
  return NextResponse.json({ proposals });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const conversationId = body.conversationId as string;
  const proposedAt = new Date(body.proposedAt);
  const durationMin = Number(body.durationMin) || 30;
  if (!conversationId || Number.isNaN(proposedAt.getTime())) {
    return NextResponse.json({ error: "conversationId and proposedAt required" }, { status: 400 });
  }

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.userAId !== session.user.id && conv.userBId !== session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const proposal = await prisma.interviewProposal.create({
    data: {
      conversationId,
      fromUserId: session.user.id,
      proposedAt,
      durationMin,
      note: body.note || null,
      meetingUrl: body.meetingUrl || null,
      status: "PENDING",
    },
  });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const systemBody = interviewSystemMessage({
    proposerName: me?.name || "Someone",
    when: proposedAt,
    durationMin,
    note: body.note,
    meetingUrl: body.meetingUrl,
  });

  await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      body: systemBody,
    },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  const otherId = conv.userAId === session.user.id ? conv.userBId : conv.userAId;
  await createNotification({
    userId: otherId,
    type: "MATCH",
    title: "Interview proposed",
    body: `${me?.name || "A match"} suggested an interview time.`,
    href: `/messages/${conversationId}`,
  });

  return NextResponse.json({ ok: true, proposal });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = body.id as string;
  const status = body.status as string;
  if (!id || !["ACCEPTED", "DECLINED"].includes(status)) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const proposal = await prisma.interviewProposal.findUnique({ where: { id } });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conv = await prisma.conversation.findUnique({ where: { id: proposal.conversationId } });
  if (!conv || (conv.userAId !== session.user.id && conv.userBId !== session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.interviewProposal.update({
    where: { id },
    data: { status },
  });

  const label = status === "ACCEPTED" ? "accepted" : "declined";
  await prisma.message.create({
    data: {
      conversationId: proposal.conversationId,
      senderId: session.user.id,
      body: `Interview ${label} for ${new Date(proposal.proposedAt).toLocaleString()}.`,
    },
  });

  return NextResponse.json({ ok: true, proposal: updated });
}
