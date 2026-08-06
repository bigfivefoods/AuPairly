import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge } from "@/components/ui";
import { ChatClient } from "@/components/chat-client";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
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

  if (!conversation) notFound();
  if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
    notFound();
  }

  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: user.id },
      status: "SENT",
    },
    data: { status: "READ" },
  });

  const other =
    conversation.userAId === user.id ? conversation.userB : conversation.userA;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar name={other.name} image={other.image} size="md" />
        <div>
          <p className="font-semibold text-stone-900">{other.name}</p>
          <Badge>{other.role === "AUPAIR" ? "Au pair" : "Family"}</Badge>
        </div>
      </div>

      <ChatClient
        conversationId={id}
        currentUserId={user.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          senderName: m.sender.name,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
