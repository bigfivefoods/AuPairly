"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
};

export function ChatClient({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [paywall, setPaywall] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || loading) return;
    setLoading(true);
    setPaywall("");
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywall(data.error || "Daily message limit reached. Upgrade for unlimited chat.");
        return;
      }
      if (res.ok && data.message) {
        setMessages((m) => [
          ...m,
          {
            id: data.message.id,
            body: data.message.body,
            senderId: data.message.senderId,
            senderName: data.message.sender?.name || "You",
            createdAt: data.message.createdAt,
          },
        ]);
        setBody("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow)]">
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            Say hello and introduce yourself.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  mine
                    ? "rounded-br-md bg-teal-600 text-white"
                    : "rounded-bl-md bg-stone-100 text-stone-800"
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine ? "text-teal-100" : "text-stone-400"
                  )}
                >
                  {format(new Date(m.createdAt), "MMM d · h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {paywall && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {paywall}{" "}
          <a href="/pricing" className="font-bold underline">
            Upgrade plan
          </a>
        </div>
      )}
      <form onSubmit={send} className="flex gap-2 border-t border-stone-100 p-3 sm:p-4">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="input-field flex-1"
        />
        <Button type="submit" disabled={loading || !body.trim()} className="!px-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
