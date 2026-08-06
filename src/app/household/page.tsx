"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";

export default function HouseholdPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [invitePath, setInvitePath] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/household");
    const d = await res.json();
    if (res.ok) setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createInvite() {
    setMsg("");
    const res = await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_invite" }),
    });
    const d = await res.json();
    if (res.status === 402) {
      setMsg(d.error || "Premium required");
      return;
    }
    if (res.ok) {
      setInvitePath(d.invitePath);
      setMsg("Invite link ready — share with your co-parent.");
      await load();
    } else setMsg(d.error || "Failed");
  }

  async function leave() {
    await fetch("/api/household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" }),
    });
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <PageHeader
        eyebrow="Premium"
        title="Partner / co-parent seat"
        description="Share shortlist and household access with a second parent (Premium families)."
      />
      <Card className="space-y-4">
        {data?.owner && (
          <p className="text-sm text-stone-600">
            You are linked to <strong>{data.owner.name}</strong>&apos;s household.
          </p>
        )}
        {data?.members?.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Members</p>
            <ul className="mt-2 text-sm text-stone-600">
              {data.members.map((m: { id: string; name: string; email: string }) => (
                <li key={m.id}>
                  {m.name} · {m.email}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={createInvite}>Generate invite link</Button>
        {invitePath && (
          <p className="break-all rounded-xl bg-stone-50 p-3 text-xs">
            {typeof window !== "undefined" ? window.location.origin : ""}
            {invitePath}
          </p>
        )}
        {data?.me?.householdOwnerId && (
          <Button variant="secondary" onClick={leave}>
            Leave household
          </Button>
        )}
        {msg && <p className="text-sm text-amber-800">{msg}</p>}
        <p className="text-xs text-stone-500">
          Need Premium? <a href="/pricing" className="font-semibold text-teal-700">Upgrade</a>
        </p>
      </Card>
    </div>
  );
}
