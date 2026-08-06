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
