"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";

type Match = {
  score: number;
  reasons: string[];
  profile: {
    id: string;
    name: string;
    headline?: string | null;
    city?: string | null;
    country?: string | null;
    swapHomeSummary?: string | null;
    href: string;
  };
};

export function HouseSwapMatches({ compact = false }: { compact?: boolean }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [needsService, setNeedsService] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/house-swap/matches");
      const data = await res.json();
      if (cancelled) return;
      if (res.status === 401) {
        setMessage("Log in as a host family to see swap matches.");
        setLoading(false);
        return;
      }
      setMatches(data.matches || []);
      setMessage(data.message || "");
      setNeedsService(Boolean(data.needsSwapService));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
      </div>
    );
  }

  if (message && matches.length === 0) {
    return (
      <Card className="border-violet-200 bg-violet-50/40">
        <p className="text-sm text-violet-950">{message}</p>
        {needsService && (
          <Link href="/profile/edit" className="btn-primary mt-3 inline-flex text-sm">
            Enable House swap on listing
          </Link>
        )}
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-stone-900">No strong swap matches yet</p>
        <p className="mt-1 text-sm text-stone-500">
          Add dates and destinations on your listing. As more hosts enable House swap, matches
          appear here.
        </p>
        <Link href="/profile/edit" className="btn-secondary mt-3 inline-flex text-sm">
          Edit swap details
        </Link>
      </Card>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <div className="flex items-center gap-2 text-violet-800">
          <ArrowLeftRight className="h-5 w-5" />
          <h2 className="font-display text-lg font-semibold">Suggested swaps</h2>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {matches.map((m) => (
          <li key={m.profile.id}>
            <Card className="h-full border-violet-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{m.profile.name}</p>
                  <p className="text-xs text-stone-500">
                    {[m.profile.city, m.profile.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                <Badge className="bg-violet-100 text-violet-900 border-violet-200">
                  {m.score}% fit
                </Badge>
              </div>
              {m.profile.headline && (
                <p className="mt-2 text-sm text-stone-600 line-clamp-2">{m.profile.headline}</p>
              )}
              {m.profile.swapHomeSummary && (
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                  {m.profile.swapHomeSummary}
                </p>
              )}
              <ul className="mt-2 space-y-0.5">
                {m.reasons.slice(0, 3).map((r) => (
                  <li key={r} className="text-[11px] text-violet-800/80">
                    · {r}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={m.profile.href} className="btn-primary !py-1.5 !px-3 text-xs">
                  View home
                </Link>
                <Link
                  href={m.profile.href}
                  className="btn-secondary !py-1.5 !px-3 text-xs"
                >
                  Wave / interest
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {!compact && (
        <Link
          href="/browse/families?service=HOUSE_SWAP"
          className="btn-secondary inline-flex text-sm"
        >
          Browse all swap homes
        </Link>
      )}
    </div>
  );
}
