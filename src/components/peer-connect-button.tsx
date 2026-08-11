"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type Status = "NONE" | "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

export function PeerConnectButton({
  toUserId,
  toName,
  initialStatus = "NONE",
  conversationId,
  className,
  variant = "primary",
}: {
  toUserId: string;
  toName: string;
  initialStatus?: Status;
  conversationId?: string | null;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatId, setChatId] = useState<string | null>(conversationId || null);

  async function handleConnect() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/community/connects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, sayHi: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/community");
          return;
        }
        if (res.status === 403) {
          setError(data.error || "Sitters only");
          return;
        }
        setError(data.error || "Could not connect");
        return;
      }
      setStatus("PENDING");
      if (data.conversationId) {
        setChatId(data.conversationId);
        router.push(`/messages/${data.conversationId}`);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ACCEPTED") {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => chatId && router.push(`/messages/${chatId}`)}
          disabled={!chatId}
        >
          <MessageCircle className="h-4 w-4" />
          Message friend
        </Button>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className={className}>
        <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled>
          <Check className="h-4 w-4" />
          Connect sent
        </Button>
        {chatId && (
          <button
            type="button"
            onClick={() => router.push(`/messages/${chatId}`)}
            className="mt-2 text-sm font-medium text-teal-700 hover:underline"
          >
            Open chat
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        variant={variant === "secondary" ? "secondary" : undefined}
        className={cn("w-full sm:w-auto", className)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span aria-hidden className="text-base leading-none">
            👋
          </span>
        )}
        Wave to connect
      </Button>
      <p className="mt-1.5 text-xs text-stone-500">
        👋 Say hi to {toName.split(" ")[0]} — connect with au pairs & sitters in your region
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
