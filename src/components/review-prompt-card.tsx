"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, Card } from "@/components/ui";

type Pending = {
  placementId: string | null;
  otherUserId: string;
  otherName: string;
  otherImage: string | null;
  status: string;
  href?: string;
};

/**
 * Dashboard prompt: leave mutual reviews after trial/placement.
 */
export function ReviewPromptCard() {
  const [items, setItems] = useState<Pending[]>([]);

  useEffect(() => {
    fetch("/api/reviews/pending")
      .then((r) => r.json())
      .then((d) => setItems(d.pending || []))
      .catch(() => null);
  }, []);

  if (!items.length) return null;

  return (
    <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Star className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Leave a review
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Reviews unlock for both sides (double-blind). Your feedback builds trust on AuPairly.
          </p>
          <ul className="mt-4 space-y-2">
            {items.slice(0, 4).map((p) => (
              <li
                key={p.placementId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={p.otherName} image={p.otherImage} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {p.otherName}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-stone-400">
                      {p.status.toLowerCase()}
                    </p>
                  </div>
                </div>
                <Link
                  href={
                    p.href ||
                    `/reviews?writeFor=${p.otherUserId}${
                      p.placementId ? `&placement=${p.placementId}` : ""
                    }`
                  }
                  className="btn-primary !px-3 !py-1.5 text-xs"
                >
                  Write review
                </Link>
              </li>
            ))}
          </ul>
          {items.length > 4 && (
            <Link
              href="/reviews"
              className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
            >
              See all pending reviews
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
