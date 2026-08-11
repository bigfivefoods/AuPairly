"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { Check, X, Star, Loader2 } from "lucide-react";

export type PendingReview = {
  id: string;
  rating: number;
  comment: string | null;
  privateNote: string | null;
  context: string;
  createdAt: string;
  author: { id: string; name: string; email: string; role: string };
  target: { id: string; name: string; email: string; role: string };
};

export function AdminReviewQueue({ initial }: { initial: PendingReview[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setItems((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="text-sm text-stone-500">
        No reviews waiting for moderation.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {items.map((r) => (
        <Card key={r.id} className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-stone-900">
                {r.author.name}{" "}
                <span className="text-stone-400 font-normal">→</span> {r.target.name}
              </p>
              <p className="text-xs text-stone-500">
                {r.author.role} → {r.target.role} · {r.context} ·{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < r.rating ? "fill-amber-400" : "text-stone-200"}`}
                />
              ))}
              <span className="ml-1 text-sm font-semibold text-stone-700">{r.rating}/5</span>
            </div>
          </div>
          {r.comment && (
            <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700 whitespace-pre-wrap">
              {r.comment}
            </p>
          )}
          {r.privateNote && (
            <p className="text-xs text-stone-500">
              Private note (owner only): {r.privateNote}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              className="!py-1.5 !px-3 text-sm"
              disabled={busy === r.id}
              onClick={() => act(r.id, "approve")}
            >
              {busy === r.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Release publicly
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!py-1.5 !px-3 text-sm"
              disabled={busy === r.id}
              onClick={() => act(r.id, "reject")}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
