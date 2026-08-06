"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";
import { PLACEMENT_LABELS, PLACEMENT_STATUSES } from "@/lib/placement-constants";

const STEPS = ["INTERESTED", "INTERVIEW", "TRIAL", "PLACED", "COMPLETED"] as const;

export function PlacementDetailClient({ id }: { id: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState({
    startDate: "",
    pocketMoney: "",
    weeklyHours: "",
    room: "",
    visa: "",
    duties: "",
  });
  const [interviewAt, setInterviewAt] = useState("");
  const [trialStart, setTrialStart] = useState("");
  const [trialEnd, setTrialEnd] = useState("");
  const [trialNotes, setTrialNotes] = useState("");
  const [contractText, setContractText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/placements/${id}`);
    const data = await res.json();
    if (res.ok) {
      setP(data.placement);
      const c = data.placement.checklist || {};
      setChecklist({
        startDate: c.startDate || "",
        pocketMoney: c.pocketMoney || "",
        weeklyHours: c.weeklyHours || "",
        room: c.room || "",
        visa: c.visa || "",
        duties: c.duties || "",
      });
      setInterviewAt(
        data.placement.interviewAt
          ? new Date(data.placement.interviewAt).toISOString().slice(0, 16)
          : ""
      );
      setTrialStart(
        data.placement.trialStart
          ? new Date(data.placement.trialStart).toISOString().slice(0, 10)
          : ""
      );
      setTrialEnd(
        data.placement.trialEnd
          ? new Date(data.placement.trialEnd).toISOString().slice(0, 10)
          : ""
      );
      setTrialNotes(data.placement.trialNotes || "");
      setContractText(data.placement.contractText || "");
    } else setError(data.error || "Failed to load");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function paySuccessFee() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/placements/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "success_fee" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment failed");
        return;
      }
      if (data.url) window.location.href = data.url;
      else await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading || !p) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(p.status);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <Card>
        <p className="text-sm text-stone-500">
          {p.parent?.name} ↔ {p.aupair?.name}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <Badge
              key={s}
              variant={i <= stepIndex ? "success" : "default"}
              className={i === stepIndex ? "ring-2 ring-teal-500" : ""}
            >
              {i + 1}. {PLACEMENT_LABELS[s]}
            </Badge>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {PLACEMENT_STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
            <Button
              key={s}
              variant={p.status === s ? "primary" : "secondary"}
              disabled={busy}
              className="!px-3 !py-1.5 !text-xs"
              onClick={() =>
                patch({
                  status: s,
                  interviewAt: interviewAt || undefined,
                  trialStart: trialStart || undefined,
                  trialEnd: trialEnd || undefined,
                })
              }
            >
              {PLACEMENT_LABELS[s]}
            </Button>
          ))}
          <Button
            variant="danger"
            disabled={busy}
            className="!text-xs"
            onClick={() => patch({ status: "CANCELLED" })}
          >
            Cancel
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Shared checklist</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["startDate", "Start date"],
              ["pocketMoney", "Pocket money"],
              ["weeklyHours", "Weekly hours"],
              ["room", "Room / housing"],
              ["visa", "Visa notes"],
              ["duties", "Duties"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                value={checklist[key]}
                onChange={(e) => setChecklist({ ...checklist, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <Button
          className="mt-4"
          disabled={busy}
          onClick={() => patch({ checklist })}
        >
          Save checklist
        </Button>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Interview scheduler</h3>
        <Label className="mt-3">Date & time</Label>
        <Input
          type="datetime-local"
          value={interviewAt}
          onChange={(e) => setInterviewAt(e.target.value)}
        />
        <Button
          className="mt-3"
          disabled={busy || !interviewAt}
          onClick={() =>
            patch({ status: "INTERVIEW", interviewAt: new Date(interviewAt).toISOString() })
          }
        >
          Schedule interview
        </Button>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Trial week tracker</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Trial start</Label>
            <Input type="date" value={trialStart} onChange={(e) => setTrialStart(e.target.value)} />
          </div>
          <div>
            <Label>Trial end</Label>
            <Input type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} />
          </div>
        </div>
        <Label className="mt-3">Notes</Label>
        <Textarea value={trialNotes} onChange={(e) => setTrialNotes(e.target.value)} />
        <Button
          className="mt-3"
          disabled={busy}
          onClick={() =>
            patch({
              status: "TRIAL",
              trialStart: trialStart || undefined,
              trialEnd: trialEnd || undefined,
              trialNotes,
            })
          }
        >
          Save trial
        </Button>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Contract template</h3>
        <Textarea
          className="mt-3 min-h-[200px] font-mono text-xs"
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
        />
        <Button className="mt-3" disabled={busy} onClick={() => patch({ contractText })}>
          Save contract
        </Button>
      </Card>

      {(p.status === "PLACED" || p.status === "COMPLETED") && (
        <Card>
          <h3 className="font-display text-lg font-semibold">Placement success fee</h3>
          <p className="mt-2 text-sm text-stone-500">
            R{(p.successFeeCents / 100).toFixed(0)} when both sides confirm a placement — powers
            the marketplace (Paystack).
          </p>
          {p.successFeePaidAt ? (
            <Badge variant="success" className="mt-4">
              Paid {new Date(p.successFeePaidAt).toLocaleDateString()}
            </Badge>
          ) : (
            <Button className="mt-4" disabled={busy} onClick={paySuccessFee}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Pay success fee
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
