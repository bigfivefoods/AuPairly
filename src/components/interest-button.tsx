"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2, Check } from "lucide-react";
import { Button, Textarea } from "@/components/ui";

export function InterestButton({
  toUserId,
  toName,
  initialStatus,
}: {
  toUserId: string;
  toName: string;
  initialStatus?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus || null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 402) {
          setError(data.error || "Upgrade to send more interests");
          return;
        }
        setError(data.error || "Could not send interest");
        return;
      }
      setStatus(data.interest.status);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "PENDING") {
    return (
      <Button variant="secondary" disabled className="w-full sm:w-auto">
        <Check className="h-4 w-4" />
        Interest sent
      </Button>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <Button variant="secondary" disabled className="w-full sm:w-auto">
        <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
        Matched interest
      </Button>
    );
  }

  return (
    <div className="w-full sm:w-auto">
      {!open ? (
        <Button
          variant="accent"
          className="w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <Heart className="h-4 w-4" />
          Express interest
        </Button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm text-stone-600">
            Tell {toName.split(" ")[0]} why you&apos;d be a great match (optional).
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A short note about timing, kids, languages…"
            className="min-h-[90px] bg-white"
          />
          {error && (
            <p className="text-sm text-red-600">
              {error}{" "}
              {error.toLowerCase().includes("upgrade") && (
                <a href="/pricing" className="font-semibold underline">
                  View plans
                </a>
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              Send interest
            </Button>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
