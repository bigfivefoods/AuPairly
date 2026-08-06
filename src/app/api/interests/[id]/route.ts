import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendInterestUpdateEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const status = body.status as string;

  if (!["ACCEPTED", "DECLINED", "WITHDRAWN"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const interest = await prisma.interest.findUnique({
    where: { id },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!interest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "WITHDRAWN") {
    if (interest.fromUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    // Accept / decline only by recipient
    if (interest.toUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.interest.update({
    where: { id },
    data: { status: status as "ACCEPTED" | "DECLINED" | "WITHDRAWN" },
  });

  if (status === "ACCEPTED" || status === "DECLINED") {
    await createNotification({
      userId: interest.fromUserId,
      type: "INTEREST_UPDATE",
      title: status === "ACCEPTED" ? "Interest accepted" : "Interest declined",
      body:
        status === "ACCEPTED"
          ? `${interest.toUser.name} accepted your interest. You can message them now.`
          : `${interest.toUser.name} declined your interest.`,
      href: status === "ACCEPTED" ? "/messages" : "/interests",
      meta: { interestId: id, status },
    });

    void sendInterestUpdateEmail({
      toEmail: interest.fromUser.email,
      toName: interest.fromUser.name,
      fromName: interest.toUser.name,
      status,
    }).catch((e) => console.error("[email] interest update", e));

    // On accept, ensure a conversation exists
    if (status === "ACCEPTED") {
      const [userAId, userBId] =
        interest.fromUserId < interest.toUserId
          ? [interest.fromUserId, interest.toUserId]
          : [interest.toUserId, interest.fromUserId];

      let conv = await prisma.conversation.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            userAId,
            userBId,
            messages: {
              create: {
                senderId: interest.toUserId,
                body: `Hi! I've accepted your interest — looking forward to chatting about a possible match.`,
              },
            },
          },
        });
      }
    }
  }

  return NextResponse.json({ interest: updated });
}
