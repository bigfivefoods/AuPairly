"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Loader2, Plus } from "lucide-react";
import { Button, Input, Label, Textarea } from "@/components/ui";

type Hangout = {
  id: string;
  city: string;
  country?: string | null;
  title: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; image?: string | null };
};

export function HangoutsPanel({
  defaultCity,
  defaultCountry,
}: {
  defaultCity?: string | null;
  defaultCountry?: string | null;
}) {
  const [city, setCity] = useState(defaultCity || "");
  const [items, setItems] = useState<Hangout[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (city.trim()) q.set("city", city.trim());
      if (defaultCountry) q.set("country", defaultCountry);
      const res = await fetch(`/api/community/hangouts?${q}`);
      const data = await res.json();
      if (res.ok) setItems(data.hangouts || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [city, defaultCountry]);

  useEffect(() => {
    load();
  }, [load]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/community/hangouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim() || defaultCity || "Anywhere",
          country: defaultCountry || undefined,
          title,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post");
        return;
      }
      setTitle("");
      setBody("");
      setShowForm(false);
      load();
    } catch {
      setError("Something went wrong");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-900">
            City hangouts &amp; tips
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Coffee meetups, weekend plans, or “new in town” notes — sitters helping sitters.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Post
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Filter by city"
          className="max-w-xs"
        />
        <Button type="button" variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={post}
          className="mt-4 space-y-3 rounded-2xl border border-teal-100 bg-teal-50/40 p-4"
        >
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coffee for new sitters this Saturday"
              required
            />
          </div>
          <div>
            <Label>Details</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Where, when, who should join…"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={posting}>
            {posting && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish hangout
          </Button>
        </form>
      )}

      {loading ? (
        <div className="mt-8 flex justify-center text-stone-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">
          No hangouts yet in this city. Be the first to post!
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((h) => (
            <li
              key={h.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1 font-semibold text-teal-800">
                  <MapPin className="h-3.5 w-3.5" />
                  {[h.city, h.country].filter(Boolean).join(", ")}
                </span>
                <span>·</span>
                <span>{h.author.name}</span>
                <span>·</span>
                <span>
                  {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-stone-900">{h.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{h.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
