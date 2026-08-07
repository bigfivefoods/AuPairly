import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar, EmptyState, PageHeader, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Chat securely with hosts, sitters, and friends from AuPair Connect."
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-7 w-7" />}
          title="No conversations yet"
          description={
            user.role === "AUPAIR"
              ? "Message hosts from Discover, or say hi to sitters nearby on AuPair Connect."
              : "Browse sitters and send a message when you find a good match."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={user.role === "AUPAIR" ? "/browse/families" : "/browse/aupairs"}
                className="btn-primary"
              >
                Browse marketplace
              </Link>
              {user.role === "AUPAIR" && (
                <Link href="/community" className="btn-secondary">
                  AuPair Connect
                </Link>
              )}
            </div>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow)] divide-y divide-stone-100">
          {conversations.map((c) => {
            const other = c.userAId === user.id ? c.userB : c.userA;
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-stone-50"
              >
                <Avatar name={other.name} image={other.image} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-stone-900">{other.name}</p>
                    <Badge>{other.role === "AUPAIR" ? "Sitter" : "Host"}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-stone-500">
                    {last?.body || "No messages yet"}
                  </p>
                </div>
                {last && (
                  <span className="shrink-0 text-xs text-stone-400">
                    {formatDistanceToNow(new Date(last.createdAt), { addSuffix: true })}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
