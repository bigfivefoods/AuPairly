"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";

type Match = {
  name: string;
  score: number;
  reasons: string[];
  href: string;
  city?: string | null;
  country?: string | null;
  headline?: string | null;
  type: string;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches/preview")
      .then((r) => r.json())
      .then((d) => {
        if (d.matches) setMatches(d.matches);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="For you"
        title="This week’s matches"
        description="Same picks we email in the weekly digest. Open Discover to swipe, or view full profiles below."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : matches.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-lg font-semibold">No matches yet</p>
          <p className="mt-2 text-sm text-stone-500">
            Complete your profile (city, languages, dates) and publish it so we can score
            compatibility.
          </p>
          <Link href="/profile/edit" className="btn-primary mt-6 inline-flex">
            Edit profile
          </Link>
        </Card>
      ) : (
        <ul className="space-y-4">
          {matches.map((m) => (
            <Card key={m.href} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{m.name}</h3>
                  <Badge variant="success">{m.score}% match</Badge>
                  <Badge>{m.type === "AUPAIR" ? "Au pair" : "Family"}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {[m.city, m.country].filter(Boolean).join(", ") || "Location TBD"}
                </p>
                {m.headline && (
                  <p className="mt-1 text-sm text-stone-600 line-clamp-1">{m.headline}</p>
                )}
                {m.reasons[0] && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-teal-800">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {m.reasons[0]}
                  </p>
                )}
              </div>
              <Link href={m.href} className="btn-secondary text-sm">
                View
              </Link>
            </Card>
          ))}
        </ul>
      )}

      <p className="mt-8 text-center text-sm text-stone-400">
        Weekly emails send automatically when Resend + cron are configured.{" "}
        <Link href="/discover" className="font-semibold text-teal-700 hover:underline">
          Open Discover
        </Link>
      </p>
    </div>
  );
}
