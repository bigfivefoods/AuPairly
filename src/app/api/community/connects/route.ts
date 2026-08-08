import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { peerIcebreaker } from "@/lib/community";

const createSchema = z.object({
  toUserId: z.string().min(1),
  message: z.string().max(1000).optional(),
  /** If true, also open a chat thread with a friendly icebreaker */
  sayHi: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const box = new URL(req.url).searchParams.get("box") || "received";

  const connects = await prisma.peerConnect.findMany({
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
          aupairProfile: {
            select: { id: true, city: true, country: true, headline: true },
          },
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
          image: true,
          aupairProfile: {
            select: { id: true, city: true, country: true, headline: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ connects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "AUPAIR") {
    return NextResponse.json(
      { error: "Only sitters can use AuPair Connect" },
      { status: 403 }
    );
  }

  const rl = rateLimit(`peer-connect:${session.user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = createSchema.parse(await req.json());
    if (body.toUserId === session.user.id) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    const [toUser, fromProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: body.toUserId },
        select: {
          id: true,
          name: true,
          role: true,
          aupairProfile: {
            select: {
              status: true,
              openToPeerConnect: true,
              city: true,
              region: true,
              country: true,
            },
          },
        },
      }),
      prisma.auPairProfile.findUnique({
        where: { userId: session.user.id },
        select: { city: true, region: true, country: true },
      }),
    ]);

    if (!toUser || toUser.role !== "AUPAIR") {
      return NextResponse.json(
        { error: "You can only connect with other sitters" },
        { status: 400 }
      );
    }
    if (
      !toUser.aupairProfile ||
      toUser.aupairProfile.status !== "ACTIVE" ||
      !toUser.aupairProfile.openToPeerConnect
    ) {
      return NextResponse.json(
        { error: "This sitter is not open to peer connects right now" },
        { status: 400 }
      );
    }

    // Always use the connector's own profile location (not free-typed search)
    const myCity = fromProfile?.city?.trim() || null;
    const myPlace = [fromProfile?.city, fromProfile?.country]
      .filter(Boolean)
      .join(", ");

    const connect = await prisma.peerConnect.upsert({
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
      userId: body.toUserId,
      type: "PEER_CONNECT",
      title: "New AuPair Connect",
      body: myPlace
        ? `${session.user.name?.split(" ")[0] || "A sitter"} (${myPlace}) wants to connect as friends`
        : `${session.user.name?.split(" ")[0] || "A sitter"} wants to connect as friends nearby`,
      href: "/community?tab=requests",
    });

    let conversationId: string | null = null;

    if (body.sayHi !== false) {
      const first = toUser.name.split(" ")[0] || "there";
      const text =
        body.message?.trim() ||
        peerIcebreaker(first, myCity, toUser.aupairProfile.city);

      const [userAId, userBId] =
        session.user.id < body.toUserId
          ? [session.user.id, body.toUserId]
          : [body.toUserId, session.user.id];

      let conversation = await prisma.conversation.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userAId, userBId },
        });
      }

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          body: text,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      await createNotification({
        userId: body.toUserId,
        type: "MESSAGE",
        title: "New message",
        body: `${session.user.name?.split(" ")[0] || "Someone"} said hi on AuPair Connect`,
        href: `/messages/${conversation.id}`,
      });

      conversationId = conversation.id;
    }

    return NextResponse.json({
      connect,
      conversationId,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("peer connect POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
