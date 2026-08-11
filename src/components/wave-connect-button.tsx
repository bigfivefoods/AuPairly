"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 👋 wave connect — peer friends (sitters) or interest (host↔sitter).
 */
export function WaveConnectButton({
  toUserId,
  toName,
  mode = "peer",
  compact = false,
  className,
}: {
  toUserId: string;
  toName: string;
  mode?: "peer" | "interest" | "profile";
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function wave() {
    setLoading(true);
    setError("");
    try {
      if (mode === "peer") {
        const res = await fetch("/api/community/connects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toUserId,
            sayHi: true,
            message: `👋 Hi ${toName.split(" ")[0] || "there"}! Saw you nearby on the map — would love to connect.`,
          }),
        });
        const data = await res.json();
        if (res.status === 401) {
          router.push("/login?callbackUrl=/map");
          return;
        }
        if (!res.ok) {
          // Fallback: open profile if peer-only fails (e.g. host viewing sitters)
          if (res.status === 403) {
            router.push(`/browse/aupairs?wave=${toUserId}`);
            return;
          }
          setError(data.error || "Could not connect");
          return;
        }
        setDone(true);
        if (data.conversationId) {
          router.push(`/messages/${data.conversationId}`);
          return;
        }
        router.refresh();
        return;
      }

      // Host↔sitter interest
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId,
          message: `👋 Hi! I'd like to connect about a placement.`,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login?callbackUrl=/map");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not send interest");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className={cn("text-xs font-semibold text-teal-700", className)}>
        👋 Sent
      </span>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={wave}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 font-semibold text-teal-800 transition hover:bg-teal-100 disabled:opacity-60",
          compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        )}
        title={`Wave hello to ${toName}`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <span aria-hidden>👋</span>
        )}
        {compact ? "Connect" : "Wave to connect"}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
