"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { PLACEMENT_LABELS, PLACEMENT_STATUSES } from "@/lib/placement-constants";
import { emptyOffer, type OfferLetter, type TrialFeedback } from "@/lib/offer-template";

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
  const [offer, setOffer] = useState<OfferLetter>(emptyOffer());
  const [trialFb, setTrialFb] = useState<TrialFeedback>({
    wouldHire: null,
    rating: null,
    strengths: "",
    concerns: "",
    notes: "",
  });

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
      setOffer({ ...emptyOffer(), ...(data.placement.offer || {}) });
      if (data.placement.trialFeedback) {
        setTrialFb({
          wouldHire: null,
          rating: null,
          strengths: "",
          concerns: "",
          notes: "",
          ...data.placement.trialFeedback,
        });
      }
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
        <h3 className="font-display text-lg font-semibold">Offer letter</h3>
        <p className="mt-1 text-sm text-stone-500">
          Structured terms both parties can accept. Saves into placement for hire kit.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Start date</Label>
            <Input
              value={offer.startDate || ""}
              onChange={(e) => setOffer({ ...offer, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Pocket money (R / week)</Label>
            <Input
              value={offer.pocketMoneyZar || ""}
              onChange={(e) => setOffer({ ...offer, pocketMoneyZar: e.target.value })}
            />
          </div>
          <div>
            <Label>Weekly hours</Label>
            <Input
              value={offer.weeklyHours || ""}
              onChange={(e) => setOffer({ ...offer, weeklyHours: e.target.value })}
            />
          </div>
          <div>
            <Label>School runs</Label>
            <Input
              value={offer.schoolRuns || ""}
              onChange={(e) => setOffer({ ...offer, schoolRuns: e.target.value })}
            />
          </div>
        </div>
        <Label className="mt-3">Duties</Label>
        <Textarea
          value={offer.duties || ""}
          onChange={(e) => setOffer({ ...offer, duties: e.target.value })}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => patch({ offer })}>
            Save offer
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => patch({ acceptOffer: true })}
          >
            I accept this offer
          </Button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Parent accepted:{" "}
          {p.offerAcceptedParentAt
            ? new Date(p.offerAcceptedParentAt).toLocaleDateString()
            : "—"}{" "}
          · Au pair accepted:{" "}
          {p.offerAcceptedAupairAt
            ? new Date(p.offerAcceptedAupairAt).toLocaleDateString()
            : "—"}
        </p>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Trial feedback</h3>
        <Label className="mt-2">Would you hire / continue?</Label>
        <Select
          value={trialFb.wouldHire === true ? "yes" : trialFb.wouldHire === false ? "no" : ""}
          onChange={(e) =>
            setTrialFb({
              ...trialFb,
              wouldHire: e.target.value === "yes" ? true : e.target.value === "no" ? false : null,
            })
          }
        >
          <option value="">Select…</option>
          <option value="yes">Yes</option>
          <option value="no">No / not yet</option>
        </Select>
        <Label className="mt-2">Rating (1–5)</Label>
        <Input
          type="number"
          min={1}
          max={5}
          value={trialFb.rating ?? ""}
          onChange={(e) =>
            setTrialFb({
              ...trialFb,
              rating: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
        <Label className="mt-2">Notes</Label>
        <Textarea
          value={trialFb.notes || ""}
          onChange={(e) => setTrialFb({ ...trialFb, notes: e.target.value })}
        />
        <Button
          className="mt-3"
          disabled={busy}
          onClick={() => patch({ trialFeedback: trialFb })}
        >
          Save trial feedback
        </Button>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Post-placement check-ins</h3>
        <p className="mt-1 text-sm text-stone-500">Day 7 and day 30 wellbeing check-ins.</p>
        <div className="mt-4 space-y-3">
          {[7, 30].map((day) => {
            const existing = (p.checkIns || []).find(
              (c: { dayOffset: number }) => c.dayOffset === day
            );
            return (
              <div key={day} className="rounded-xl border border-stone-100 p-3">
                <p className="font-semibold text-sm">Day {day}</p>
                {existing?.respondedAt ? (
                  <p className="text-xs text-stone-500">
                    Logged {new Date(existing.respondedAt).toLocaleDateString()}
                    {existing.rating != null ? ` · ${existing.rating}/5` : ""}
                    {existing.response ? ` — ${existing.response}` : ""}
                  </p>
                ) : (
                  <Button
                    className="mt-2 !text-xs"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      patch({
                        checkIn: {
                          dayOffset: day,
                          rating: 5,
                          response: "All good so far",
                        },
                      })
                    }
                  >
                    Mark day {day} OK
                  </Button>
                )}
              </div>
            );
          })}
        </div>
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
