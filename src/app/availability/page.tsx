"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";

type Slot = {
  id: string;
  kind: string;
  startDate: string;
  endDate: string;
  note?: string | null;
};

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("FREE");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

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
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, startDate, endDate, note }),
    });
    setBusy(false);
    setNote("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/availability?id=${id}`, { method: "DELETE" });
    setSlots((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Calendar"
        title="Availability"
        description="Mark free windows, busy periods, or weeks you need cover. Matches filter against these dates."
      />

      <Card className="mb-8">
        <form onSubmit={add} className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="FREE">Free / available</option>
              <option value="BUSY">Busy / away</option>
              <option value="NEED_COVER">Need cover (families)</option>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Start</Label>
              <Input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Add block
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
                <p className="font-semibold text-stone-900">{s.kind.replace("_", " ")}</p>
                <p className="text-sm text-stone-500">
                  {new Date(s.startDate).toLocaleDateString()} →{" "}
                  {new Date(s.endDate).toLocaleDateString()}
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
            <p className="text-center text-sm text-stone-500">No upcoming blocks yet.</p>
          )}
        </ul>
      )}
    </div>
  );
}
