"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui";

export function InterestActions({
  interestId,
  mode,
}: {
  interestId: string;
  mode: "receive" | "sent";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(status: "ACCEPTED" | "DECLINED" | "WITHDRAWN") {
    setLoading(status);
    setError("");
    try {
      const res = await fetch(`/api/interests/${interestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Action failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (mode === "sent") {
    return (
      <div>
        <Button
          variant="ghost"
          disabled={!!loading}
          onClick={() => act("WITHDRAWN")}
          className="text-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
          Withdraw
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        disabled={!!loading}
        onClick={() => act("ACCEPTED")}
        className="!py-2 text-sm"
      >
        {loading === "ACCEPTED" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Accept
      </Button>
      <Button
        variant="secondary"
        disabled={!!loading}
        onClick={() => act("DECLINED")}
        className="!py-2 text-sm"
      >
        {loading === "DECLINED" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        Decline
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
