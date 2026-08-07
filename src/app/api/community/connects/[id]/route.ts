import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const patchSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "WITHDRAWN"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const connect = await prisma.peerConnect.findUnique({ where: { id } });
  if (!connect) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await req.json());

    if (body.status === "WITHDRAWN") {
      if (connect.fromUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      if (connect.toUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.peerConnect.update({
      where: { id },
      data: { status: body.status },
    });

    if (body.status === "ACCEPTED") {
      await createNotification({
        userId: connect.fromUserId,
        type: "PEER_CONNECT",
        title: "Connection accepted",
        body: `${session.user.name?.split(" ")[0] || "A sitter"} accepted your AuPair Connect request`,
        href: "/community?tab=friends",
      });

      // Ensure a conversation exists for follow-up
      const [userAId, userBId] =
        connect.fromUserId < connect.toUserId
          ? [connect.fromUserId, connect.toUserId]
          : [connect.toUserId, connect.fromUserId];
      let conversation = await prisma.conversation.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userAId, userBId },
        });
      }
      return NextResponse.json({
        connect: updated,
        conversationId: conversation.id,
      });
    }

    return NextResponse.json({ connect: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("peer connect PATCH", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
