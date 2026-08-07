"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UnreadMessagesLink({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = await res.json();
      const conversations = data.conversations || [];
      // Approximate: last message not from me and status SENT
      // API returns lastMessage with status if included
      let n = 0;
      for (const c of conversations) {
        const last = c.lastMessage;
        if (
          last &&
          last.status === "SENT" &&
          last.senderId &&
          c.other?.id &&
          last.senderId === c.other.id
        ) {
          n += 1;
        }
      }
      setCount(n);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <Link
      href="/messages"
      className={cn(
        "relative rounded-full p-2 text-stone-600 transition hover:bg-white hover:text-teal-700",
        className
      )}
      aria-label={count ? `Messages, ${count} unread` : "Messages"}
      title="Messages"
    >
      <MessageCircle className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
