import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar, EmptyState, PageHeader, Badge } from "@/components/ui";
import { roleLabel } from "@/lib/brand";
import { cn } from "@/lib/utils";

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
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderId: true,
          status: true,
        },
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
              <Link href="/discover" className="btn-secondary">
                Discover
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
            const unread =
              Boolean(last) &&
              last!.senderId !== user.id &&
              last!.status === "SENT";
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 transition hover:bg-stone-50",
                  unread && "bg-teal-50/40"
                )}
              >
                <div className="relative">
                  <Avatar name={other.name} image={other.image} size="md" />
                  {unread && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "truncate text-stone-900",
                        unread ? "font-bold" : "font-semibold"
                      )}
                    >
                      {other.name}
                    </p>
                    <Badge>{roleLabel(other.role)}</Badge>
                    {unread && (
                      <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm",
                      unread ? "font-medium text-stone-800" : "text-stone-500"
                    )}
                  >
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
