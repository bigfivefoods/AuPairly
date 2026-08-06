"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card, PageHeader } from "@/components/ui";

function JoinInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", token }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(d.error || "Could not join");
      return;
    }
    setMsg(`Joined ${d.ownerName}'s household`);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageHeader
        eyebrow="Household"
        title="Join partner seat"
        description="Accept a co-parent invite to share family shortlist access."
      />
      <Card className="text-center">
        {!token ? (
          <p className="text-sm text-red-600">Missing invite token.</p>
        ) : (
          <>
            <Button disabled={busy} onClick={join}>
              Accept invite
            </Button>
            {msg && <p className="mt-3 text-sm text-stone-600">{msg}</p>}
          </>
        )}
      </Card>
    </div>
  );
}

export default function HouseholdJoinPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <JoinInner />
    </Suspense>
  );
}
