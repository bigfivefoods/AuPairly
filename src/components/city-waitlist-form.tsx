"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export function CityWaitlistForm({
  city,
  slug,
  defaultRole = "BOTH",
}: {
  city: string;
  slug?: string;
  defaultRole?: "PARENT" | "AUPAIR" | "BOTH";
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city, slug, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not join waitlist");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
        You&apos;re on the list for <strong>{city}</strong>. We&apos;ll email when more hosts and
        sitters join nearby.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        <Mail className="h-4 w-4 text-teal-700" />
        Be first in {city}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        Thin local supply right now — join the waitlist and we&apos;ll notify you as people join.
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor="waitlist-email">Email</Label>
          <Input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              ["BOTH", "Both"],
              ["PARENT", "I need help"],
              ["AUPAIR", "I offer care"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className={
                role === id
                  ? "rounded-full bg-teal-600 px-3 py-1 font-semibold text-white"
                  : "rounded-full bg-stone-100 px-3 py-1 font-semibold text-stone-600"
              }
            >
              {label}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Notify me
        </Button>
      </div>
    </form>
  );
}
