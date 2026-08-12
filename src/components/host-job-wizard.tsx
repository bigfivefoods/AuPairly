"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { Loader2, CheckCircle2 } from "lucide-react";

export function HostJobWizard() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    headline: "",
    jobEntails: "",
    startDate: "",
    endDate: "",
    liveIn: true,
    pocketMoney: "",
    benefits: "",
    visaSupport: "",
    city: "",
    country: "South Africa",
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
      const res = await fetch("/api/profiles/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline || "Host family looking for help",
          jobEntails: form.jobEntails,
          preferences: form.jobEntails,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          liveIn: form.liveIn,
          pocketMoney: form.pocketMoney ? Number(form.pocketMoney) : null,
          benefits: form.benefits,
          visaSupport: form.visaSupport || null,
          city: form.city,
          country: form.country,
          status: form.status,
          services: ["CHILDCARE"],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return;
      }
      setMsg("Job posted! Add photos and extra services next.");
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
      <div>
        <Label>Headline</Label>
        <Input
          value={form.headline}
          onChange={(e) => set("headline", e.target.value)}
          placeholder="e.g. Family of 3 needs after-school care in Rondebosch"
        />
      </div>
      <div>
        <Label>What the job entails</Label>
        <Textarea
          value={form.jobEntails}
          onChange={(e) => set("jobEntails", e.target.value)}
          placeholder="Typical day, school runs, ages, evenings…"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Start date</Label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </div>
        <div>
          <Label>End date (optional)</Label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Pay / pocket money (R/wk)</Label>
          <Input
            type="number"
            value={form.pocketMoney}
            onChange={(e) => set("pocketMoney", e.target.value)}
          />
        </div>
        <div>
          <Label>Visa / passport</Label>
          <Select
            value={form.visaSupport}
            onChange={(e) => set("visaSupport", e.target.value)}
          >
            <option value="">Not specified</option>
            <option value="NONE">No visa support</option>
            <option value="HELP">Help with paperwork</option>
            <option value="SPONSOR">Can sponsor / support</option>
            <option value="CITIZEN_ONLY">Citizens / work rights required</option>
          </Select>
        </div>
      </div>
      <div>
        <Label>Benefits</Label>
        <Textarea
          value={form.benefits}
          onChange={(e) => set("benefits", e.target.value)}
          placeholder="Meals, room, transport, data…"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.liveIn}
          onChange={(e) => set("liveIn", e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-teal-600"
        />
        Live-in arrangement
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={save}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish job
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => {
            set("status", "DRAFT");
            void save();
          }}
        >
          Save draft
        </Button>
      </div>
      {msg && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
