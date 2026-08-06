"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { Loader2, Sparkles } from "lucide-react";

function BoostInner() {
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch("/api/boost/analytics")
      .then((r) => r.json())
      .then((d) => setAnalytics(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ref = sp.get("reference");
    if (sp.get("paid") && ref) {
      fetch("/api/boost", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setMsg(`Boost active until ${new Date(d.boostedUntil).toLocaleDateString()}`);
          else setMsg(d.error || "Could not verify boost");
        });
    }
  }, [sp]);

  async function buy() {
    setBusy(true);
    const res = await fetch("/api/boost", { method: "POST" });
    const d = await res.json();
    setBusy(false);
    if (d.url) window.location.href = d.url;
    else if (d.demo) setMsg(d.message);
    else setMsg(d.error || "Failed");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <PageHeader
        eyebrow="Visibility"
        title="Featured boost"
        description="R49 for 7 days at the top of search & Discover."
      />
      <Card className="text-center">
        <Sparkles className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-4 text-sm text-stone-500">
          Featured badge + priority sort while your boost is active. Paid via Paystack (Apple Pay
          ready).
        </p>
        <Button className="mt-6 w-full" disabled={busy} onClick={buy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Boost for R49
        </Button>
        {msg && <p className="mt-4 text-sm text-emerald-700">{msg}</p>}
      </Card>

      {analytics && (
        <Card className="mt-6">
          <h3 className="font-display text-lg font-semibold">Boost analytics</h3>
          <p className="mt-2 text-sm text-stone-500">
            Lifetime while boosted:{" "}
            <strong>{analytics.totals?.boostViews ?? 0}</strong> profile views ·{" "}
            <strong>{analytics.totals?.boostLikes ?? 0}</strong> likes tracked
          </p>
          {analytics.active && (
            <p className="mt-2 text-xs text-teal-800">
              Active boost until {new Date(analytics.active.endsAt).toLocaleDateString()} —{" "}
              {analytics.active.views} views · {analytics.active.likes} likes ·{" "}
              {analytics.active.messages} messages
            </p>
          )}
          {Array.isArray(analytics.events) && analytics.events.length > 0 && (
            <ul className="mt-4 space-y-2 text-xs text-stone-600">
              {analytics.events.slice(0, 5).map(
                (e: {
                  id: string;
                  startedAt: string;
                  endsAt: string;
                  views: number;
                  likes: number;
                  messages: number;
                }) => (
                  <li key={e.id} className="rounded-lg bg-stone-50 px-3 py-2">
                    {new Date(e.startedAt).toLocaleDateString()} →{" "}
                    {new Date(e.endsAt).toLocaleDateString()}: {e.views} views, {e.likes} likes,{" "}
                    {e.messages} msgs
                  </li>
                )
              )}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

export default function BoostPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <BoostInner />
    </Suspense>
  );
}
