"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Textarea, Select } from "@/components/ui";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Super-short sitter publish: photo optional later, city + headline + bio + service.
 */
export function QuickSitterWizard() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    city: "",
    country: "South Africa",
    service: "CHILDCARE",
    status: "ACTIVE" as "DRAFT" | "ACTIVE",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/profiles/aupair", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline:
            form.headline || "Trusted sitter ready to help your household",
          bio:
            form.bio ||
            "I offer reliable care and am happy to share experience, references, and availability on AuPairly.",
          city: form.city,
          country: form.country,
          languages: ["English"],
          services: [form.service],
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            (data.blockers ? data.blockers.join(" · ") : "Could not save")
        );
        return;
      }
      setMsg("Listing live! Add a photo next for more replies.");
      router.push("/profile/edit");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <p className="text-sm text-stone-500">
        Publish in under 2 minutes. Photo, video, and documents can wait — hosts
        message complete profiles first.
      </p>
      <div>
        <Label>Headline (what you offer)</Label>
        <Input
          value={form.headline}
          onChange={(e) => set("headline", e.target.value)}
          placeholder="e.g. Experienced childcare & tutor in Cape Town"
        />
      </div>
      <div>
        <Label>Short bio</Label>
        <Textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          placeholder="Ages you care for, languages, driving, availability…"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>City</Label>
          <Input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Cape Town"
          />
        </div>
        <div>
          <Label>Country</Label>
          <Input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Primary service</Label>
        <Select
          value={form.service}
          onChange={(e) => set("service", e.target.value)}
        >
          <option value="CHILDCARE">Childcare / au pair</option>
          <option value="TUTORING">Tutoring</option>
          <option value="CAREGIVING">Caregiving</option>
          <option value="HOUSE_SITTING">House sitting</option>
          <option value="PET_SITTING">Dog / pet sitting</option>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={form.status === "ACTIVE"}
          onChange={(e) => set("status", e.target.checked ? "ACTIVE" : "DRAFT")}
          className="h-4 w-4 rounded border-stone-300 text-teal-600"
        />
        Publish now (go live in browse)
      </label>
      <Button type="button" disabled={busy || !form.city.trim()} onClick={save}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {form.status === "ACTIVE" ? "Publish free listing" : "Save draft"}
      </Button>
      {msg && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
