"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, Loader2, Search, Trash2 } from "lucide-react";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";

type SearchItem = {
  id: string;
  name: string;
  filters: Record<string, string>;
  alertEnabled: boolean;
  lastAlertedAt?: string | null;
};

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Local matches");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [roleTarget, setRoleTarget] = useState<"aupairs" | "families">("aupairs");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Record<string, number>>({});

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
        filters: {
          city,
          country,
          verified: "1",
          target: roleTarget,
        },
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

  async function previewCount(s: SearchItem) {
    const target = s.filters.target === "families" ? "families" : "aupairs";
    const q = new URLSearchParams();
    if (s.filters.city) q.set("city", s.filters.city);
    if (s.filters.country) q.set("country", s.filters.country);
    if (s.filters.verified) q.set("verified", s.filters.verified);
    // Use browse API via page count approximation: hit nearby or just open link
    // Lightweight: count via public browse is hard; use dedicated preview endpoint
    try {
      const res = await fetch(
        `/api/saved-searches/preview?city=${encodeURIComponent(s.filters.city || "")}&country=${encodeURIComponent(s.filters.country || "")}&target=${target}&verified=${s.filters.verified || ""}`
      );
      const data = await res.json();
      if (res.ok) setPreview((p) => ({ ...p, [s.id]: data.count ?? 0 }));
    } catch {
      /* ignore */
    }
  }

  function hrefFor(filters: Record<string, string>) {
    const base = filters.target === "families" ? "/browse/families" : "/browse/aupairs";
    const q = new URLSearchParams();
    if (filters.city) q.set("city", filters.city);
    if (filters.country) q.set("country", filters.country);
    if (filters.verified) q.set("verified", filters.verified);
    if (filters.driving) q.set("driving", filters.driving);
    return `${base}?${q.toString()}`;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader
        eyebrow="Alerts"
        title="Saved searches"
        description="Get daily in-app alerts when new sitters or hosts match your filters. Turn alerts on to never miss a local match."
      />

      <Card className="mb-8">
        <h2 className="font-display text-lg font-semibold">Create a search alert</h2>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cape Town"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Looking for</Label>
            <select
              className="input-field"
              value={roleTarget}
              onChange={(e) => setRoleTarget(e.target.value as "aupairs" | "families")}
            >
              <option value="aupairs">Sitters</option>
              <option value="families">Hosts</option>
            </select>
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Save &amp; enable alerts
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12 text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : searches.length === 0 ? (
        <p className="text-center text-sm text-stone-500">
          No saved searches yet. Create one above to get daily match digests.
        </p>
      ) : (
        <ul className="space-y-3">
          {searches.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">{s.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {[s.filters.city, s.filters.country].filter(Boolean).join(", ") ||
                      "Any location"}
                    {s.filters.target === "families" ? " · Hosts" : " · Sitters"}
                    {s.filters.verified === "1" ? " · Verified only" : ""}
                  </p>
                  {s.lastAlertedAt && (
                    <p className="mt-1 text-[11px] text-stone-400">
                      Last alert: {new Date(s.lastAlertedAt).toLocaleString()}
                    </p>
                  )}
                  {preview[s.id] != null && (
                    <p className="mt-1 text-xs font-medium text-teal-700">
                      {preview[s.id]} active listing(s) match now
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAlert(s.id, !s.alertEnabled)}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:border-teal-300"
                  >
                    {s.alertEnabled ? (
                      <>
                        <Bell className="h-3.5 w-3.5 text-teal-600" /> Alerts on
                      </>
                    ) : (
                      <>
                        <BellOff className="h-3.5 w-3.5" /> Alerts off
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => previewCount(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:border-teal-300"
                  >
                    <Search className="h-3.5 w-3.5" /> Preview
                  </button>
                  <Link
                    href={hrefFor(s.filters)}
                    className="inline-flex items-center rounded-full bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Browse
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="rounded-full p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
