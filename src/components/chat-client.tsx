"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar, Loader2, Send, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { icebreakers, safetyWarningForMessage } from "@/lib/icebreakers";

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
  myRole = "PARENT",
  theirName = "there",
  city,
  sharedLanguages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Msg[];
  myRole?: string;
  theirName?: string;
  city?: string | null;
  sharedLanguages?: string[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [paywall, setPaywall] = useState("");
  const [safetyTip, setSafetyTip] = useState<string | null>(null);
  const [showInterview, setShowInterview] = useState(false);
  const [interviewAt, setInterviewAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const prompts = icebreakers({
    myRole,
    theirName,
    city,
    sharedLanguages,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSafetyTip(safetyWarningForMessage(body));
  }, [body]);

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

  async function proposeInterview() {
    if (!interviewAt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          proposedAt: interviewAt,
          durationMin: 30,
          meetingUrl: meetingUrl || null,
          note: interviewNote || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowInterview(false);
        // Reload messages
        const mres = await fetch(`/api/messages/${conversationId}`);
        const mdata = await mres.json();
        if (mres.ok && mdata.conversation?.messages) {
          setMessages(
            mdata.conversation.messages.map(
              (m: {
                id: string;
                body: string;
                senderId: string;
                sender?: { name?: string };
                createdAt: string;
              }) => ({
                id: m.id,
                body: m.body,
                senderId: m.senderId,
                senderName: m.sender?.name || "User",
                createdAt: m.createdAt,
              })
            )
          );
        } else if (data.proposal) {
          // fallback: client already got system message from server in other sessions
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[min(70dvh,640px)] min-h-[22rem] flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow)] sm:h-[min(72dvh,680px)] md:min-h-[28rem]">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-3 py-2">
        <button
          type="button"
          onClick={() => setShowInterview((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"
        >
          <Calendar className="h-3.5 w-3.5" />
          Propose interview
        </button>
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
          <ShieldAlert className="h-3.5 w-3.5" />
          Keep chats on AuPairly until you trust each other
        </span>
      </div>

      {showInterview && (
        <div className="space-y-2 border-b border-stone-100 bg-stone-50 px-4 py-3 text-sm">
          <p className="font-semibold text-stone-800">Schedule a video/intro call</p>
          <input
            type="datetime-local"
            className="input-field"
            value={interviewAt}
            onChange={(e) => setInterviewAt(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Meeting link (optional)"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Note (optional)"
            value={interviewNote}
            onChange={(e) => setInterviewNote(e.target.value)}
          />
          <Button type="button" disabled={loading || !interviewAt} onClick={proposeInterview}>
            Send proposal
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="border-b border-stone-100 bg-amber-50/60 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <Sparkles className="h-3.5 w-3.5" />
            Icebreakers — tap to use
          </p>
          <div className="flex flex-col gap-1.5">
            {prompts.slice(0, 3).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setBody(p)}
                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-left text-xs text-stone-700 hover:border-teal-300"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-400">
            Say hello and introduce yourself — or pick an icebreaker above.
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

      {safetyTip && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          {safetyTip}
        </div>
      )}

      {paywall && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {paywall}{" "}
          <a href="/pricing" className="font-bold underline">
            Upgrade plan
          </a>
        </div>
      )}
      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-stone-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="input-field min-w-0 flex-1 !py-2.5 text-base"
          enterKeyHint="send"
        />
        <Button
          type="submit"
          disabled={loading || !body.trim()}
          className="btn-inline !min-h-11 !w-11 shrink-0 !rounded-full !px-0"
          aria-label="Send"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
