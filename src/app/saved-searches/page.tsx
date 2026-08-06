"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";

type Search = {
  id: string;
  name: string;
  filters: Record<string, string>;
  alertEnabled: boolean;
};

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Local matches");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/saved-searches");
    const data = await res.json();
    if (res.ok) setSearches(data.searches || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        filters: { city, country, verified: "1" },
        alertEnabled: true,
      }),
    });
    setBusy(false);
    await load();
  }

  async function toggleAlert(id: string, alertEnabled: boolean) {
    await fetch("/api/saved-searches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, alertEnabled }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/saved-searches?id=${id}`, { method: "DELETE" });
    setSearches((s) => s.filter((x) => x.id !== id));
  }

  function hrefFor(filters: Record<string, string>) {
    const q = new URLSearchParams();
    if (filters.city) q.set("q", filters.city);
    if (filters.country) q.set("country", filters.country);
    if (filters.verified) q.set("verified", filters.verified);
    if (filters.driving) q.set("driving", filters.driving);
    return `/browse/aupairs?${q.toString()}`;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Alerts"
        title="Saved searches"
        description="Get notified when new families or au pairs match your filters."
      />

      <Card className="mb-8">
        <form onSubmit={create} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cape Town" />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save search + enable alerts
          </Button>
        </form>
      </Card>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
      ) : (
        <ul className="space-y-3">
          {searches.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-stone-500">
                    {JSON.stringify(s.filters)}
                  </p>
                  <Link href={hrefFor(s.filters)} className="text-xs font-semibold text-teal-700">
                    Run search →
                  </Link>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-teal-700"
                    onClick={() => toggleAlert(s.id, !s.alertEnabled)}
                  >
                    Alerts: {s.alertEnabled ? "On" : "Off"}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => remove(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {searches.length === 0 && (
            <p className="text-center text-sm text-stone-500">No saved searches yet.</p>
          )}
        </ul>
      )}
    </div>
  );
}
