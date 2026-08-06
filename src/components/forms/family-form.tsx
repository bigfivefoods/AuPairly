"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ChipToggle,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import {
  COUNTRY_OPTIONS,
  DUTY_OPTIONS,
  LANGUAGE_OPTIONS,
  OFFER_OPTIONS,
} from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";

type Initial = {
  name: string;
  phone: string;
  image?: string | null;
  headline: string;
  bio: string;
  familyName: string;
  city: string;
  country: string;
  addressArea: string;
  childrenCount: string;
  childrenAges: string[];
  childrenDetails: string;
  languages: string[];
  preferences: string;
  duties: string[];
  offers: string[];
  startDate: string;
  durationMonths: string;
  weeklyHours: string;
  pocketMoney: string;
  liveIn: boolean;
  hasPets: boolean;
  petDetails: string;
  ownRoom: boolean;
  carProvided: boolean;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
};

export function FamilyProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [image, setImage] = useState(initial.image || "");
  const [ageInput, setAgeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(key: "languages" | "duties" | "offers", value: string) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  }

  function addAge() {
    if (!ageInput.trim()) return;
    setForm((f) => ({ ...f, childrenAges: [...f.childrenAges, ageInput.trim()] }));
    setAgeInput("");
  }

  async function save(status?: Initial["status"]) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/profiles/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: status ?? form.status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setMessage(status === "ACTIVE" ? "Listing published!" : "Saved successfully.");
      if (status) setForm((f) => ({ ...f, status }));
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Profile photo</h2>
        <PhotoUpload
          name={form.familyName || form.name || "Family"}
          currentImage={image}
          onUploaded={(url) => {
            setImage(url);
            router.refresh();
          }}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Family basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Your name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Family name (public)</Label>
            <Input value={form.familyName} onChange={(e) => set("familyName", e.target.value)} placeholder="The Rivera Family" />
          </div>
          <div>
            <Label>Phone (private)</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="Active family of 4 seeking a kind, energetic au pair"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>About our family</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Describe your home, values, lifestyle, and neighborhood…"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Children</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Number of children</Label>
            <Input type="number" min={1} value={form.childrenCount} onChange={(e) => set("childrenCount", e.target.value)} />
          </div>
          <div>
            <Label>Add child age</Label>
            <div className="flex gap-2">
              <Input value={ageInput} onChange={(e) => setAgeInput(e.target.value)} placeholder="e.g. 3" />
              <Button type="button" variant="secondary" onClick={addAge}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.childrenAges.map((a) => (
                <ChipToggle
                  key={a}
                  label={`Age ${a}`}
                  selected
                  onClick={() =>
                    set(
                      "childrenAges",
                      form.childrenAges.filter((x) => x !== a)
                    )
                  }
                />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>About the kids</Label>
            <Textarea value={form.childrenDetails} onChange={(e) => set("childrenDetails", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Select value={form.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">Select…</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Neighborhood / area (no full address)</Label>
            <Input value={form.addressArea} onChange={(e) => set("addressArea", e.target.value)} placeholder="e.g. Park Slope" />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Languages at home</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <ChipToggle key={l} label={l} selected={form.languages.includes(l)} onClick={() => toggle("languages", l)} />
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">The role</h2>
        <div>
          <Label>What we&apos;re looking for</Label>
          <Textarea value={form.preferences} onChange={(e) => set("preferences", e.target.value)} />
        </div>
        <div>
          <Label>Duties</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DUTY_OPTIONS.map((d) => (
              <ChipToggle key={d} label={d} selected={form.duties.includes(d)} onClick={() => toggle("duties", d)} />
            ))}
          </div>
        </div>
        <div>
          <Label>We offer</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {OFFER_OPTIONS.map((o) => (
              <ChipToggle key={o} label={o} selected={form.offers.includes(o)} onClick={() => toggle("offers", o)} />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div>
            <Label>Duration (months)</Label>
            <Input type="number" value={form.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} />
          </div>
          <div>
            <Label>Hours per week</Label>
            <Input type="number" value={form.weeklyHours} onChange={(e) => set("weeklyHours", e.target.value)} />
          </div>
          <div>
            <Label>Pocket money ($/wk)</Label>
            <Input type="number" value={form.pocketMoney} onChange={(e) => set("pocketMoney", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["liveIn", "Live-in arrangement"],
              ["ownRoom", "Private room for au pair"],
              ["carProvided", "Car provided"],
              ["hasPets", "We have pets"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-teal-600"
              />
              {label}
            </label>
          ))}
        </div>
        {form.hasPets && (
          <div>
            <Label>Pet details</Label>
            <Input value={form.petDetails} onChange={(e) => set("petDetails", e.target.value)} placeholder="Friendly golden retriever" />
          </div>
        )}
      </Card>

      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </p>
      )}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => save()} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save draft
        </Button>
        <Button variant="accent" onClick={() => save("ACTIVE")} disabled={loading}>
          Publish listing
        </Button>
        {form.status === "ACTIVE" && (
          <Button variant="secondary" onClick={() => save("PAUSED")} disabled={loading}>
            Pause listing
          </Button>
        )}
      </div>
    </div>
  );
}
