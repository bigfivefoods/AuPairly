"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";

type Slot = {
  id: string;
  kind: string;
  startDate: string;
  endDate: string;
  note?: string | null;
};

function toLocalInputValue(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("FREE");
  const [startDate, setStart] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return toLocalInputValue(d);
  });
  const [endDate, setEnd] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 5);
    return toLocalInputValue(d);
  });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/availability");
    const data = await res.json();
    if (res.ok) setSlots(data.slots || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        note,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save window");
      return;
    }
    setNote("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/availability?id=${id}`, { method: "DELETE" });
    setSlots((s) => s.filter((x) => x.id !== id));
  }

  function quickDay(hoursStart: number, hoursEnd: number) {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(hoursStart, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hoursEnd, 0, 0, 0);
    setStart(toLocalInputValue(start));
    setEnd(toLocalInputValue(end));
    setKind("FREE");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Calendar"
        title="Dates & times"
        description="Mark specific free windows, busy periods, or weeks you need cover. Au pairs: publish when you can work. Families: mark cover needs."
      />

      <p className="mb-6 text-sm text-stone-600">
        For your usual weekly pattern (every Monday 8–5, etc.), set it on your{" "}
        <Link href="/profile/edit" className="font-semibold text-teal-700 hover:underline">
          profile schedule
        </Link>
        . Use this page for one-off dates and exact times.
      </p>

      <Card className="mb-8">
        <form onSubmit={add} className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="FREE">Free / available to work</option>
              <option value="BUSY">Busy / away</option>
              <option value="NEED_COVER">Need cover (families)</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold"
              onClick={() => quickDay(8, 17)}
            >
              Tomorrow 08:00–17:00
            </button>
            <button
              type="button"
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold"
              onClick={() => quickDay(14, 18)}
            >
              Tomorrow 14:00–18:00
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Ends</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Can do school run · live-out only that week"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Add date & time window
          </Button>
        </form>
      </Card>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
      ) : (
        <ul className="space-y-3">
          {slots.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold text-stone-900">
                  {s.kind === "FREE"
                    ? "Available"
                    : s.kind === "NEED_COVER"
                      ? "Need cover"
                      : "Busy"}
                </p>
                <p className="text-sm text-stone-500">
                  {new Date(s.startDate).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" → "}
                  {new Date(s.endDate).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {s.note && <p className="text-xs text-stone-500">{s.note}</p>}
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-red-600"
                onClick={() => remove(s.id)}
              >
                Remove
              </button>
            </li>
          ))}
          {slots.length === 0 && (
            <p className="text-center text-sm text-stone-500">
              No upcoming date windows yet. Add free times so families know when you can start.
            </p>
          )}
        </ul>
      )}
    </div>
  );
}
