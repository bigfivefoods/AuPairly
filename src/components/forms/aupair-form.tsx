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
  LANGUAGE_OPTIONS,
  SKILL_OPTIONS,
} from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";
import { ScheduleEditor } from "@/components/schedule-editor";
import {
  computeWeeklyHours,
  parseSchedule,
  serializeSchedule,
  type RecurringSchedule,
} from "@/lib/schedule";

type Initial = {
  name: string;
  phone: string;
  image?: string | null;
  headline: string;
  bio: string;
  nationality: string;
  languages: string[];
  age: string;
  gender: string;
  experienceYears: string;
  childcareSkills: string[];
  education: string;
  drivingLicense: boolean;
  firstAid: boolean;
  swimming: boolean;
  nonSmoker: boolean;
  preferredCountries: string[];
  availableFrom: string;
  availableTo: string;
  durationMonths: string;
  weeklyHours: string;
  pocketMoneyMin: string;
  liveIn: boolean;
  city: string;
  country: string;
  workRights: string;
  willingRelocate: boolean;
  relocateCities: string[];
  certificates: string[];
  scheduleJson?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
};

export function AuPairProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [image, setImage] = useState(initial.image || "");
  const [schedule, setSchedule] = useState<RecurringSchedule>(() =>
    parseSchedule(initial.scheduleJson)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggle(
    key: "languages" | "childcareSkills" | "preferredCountries" | "relocateCities" | "certificates",
    value: string
  ) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  }

  async function save(status?: Initial["status"]) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const computedHours = computeWeeklyHours(schedule);
      const hasScheduleDays = schedule.days.some((d) => d.enabled);
      const weeklyHours =
        hasScheduleDays && computedHours > 0
          ? String(Math.round(computedHours))
          : form.weeklyHours;

      const res = await fetch("/api/profiles/aupair", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weeklyHours,
          scheduleJson: serializeSchedule(schedule),
          status: status ?? form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setMessage(status === "ACTIVE" ? "Profile published!" : "Saved successfully.");
      if (status) setForm((f) => ({ ...f, status }));
      if (hasScheduleDays) setForm((f) => ({ ...f, weeklyHours }));
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
          name={form.name || "Au pair"}
          currentImage={image}
          onUploaded={(url) => {
            setImage(url);
            router.refresh();
          }}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Gallery photos</h2>
        <p className="text-sm text-stone-500">
          Add more photos of yourself (with kids, activities, travel). Stored on Supabase when configured.
        </p>
        <PhotoUpload
          name={form.name || "Au pair"}
          kind="gallery"
          onUploaded={() => router.refresh()}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
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
              placeholder="Warm, experienced au pair who loves outdoor play"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>About you</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell families about your experience, personality, and what you're looking for…"
            />
          </div>
          <div>
            <Label>Nationality</Label>
            <Input value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
          </div>
          <div>
            <Label>Age</Label>
            <Input type="number" min={18} max={45} value={form.age} onChange={(e) => set("age", e.target.value)} />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
            </Select>
          </div>
          <div>
            <Label>Years of experience</Label>
            <Input type="number" min={0} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} />
          </div>
          <div>
            <Label>Education</Label>
            <Input value={form.education} onChange={(e) => set("education", e.target.value)} placeholder="e.g. Early childhood diploma" />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Languages</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <ChipToggle
              key={l}
              label={l}
              selected={form.languages.includes(l)}
              onClick={() => toggle("languages", l)}
            />
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Childcare skills</h2>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((s) => (
            <ChipToggle
              key={s}
              label={s}
              selected={form.childcareSkills.includes(s)}
              onClick={() => toggle("childcareSkills", s)}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["drivingLicense", "Driving license"],
              ["firstAid", "First aid certified"],
              ["swimming", "Can swim"],
              ["nonSmoker", "Non-smoker"],
              ["liveIn", "Prefer live-in"],
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
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Availability & location</h2>
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
          <div>
            <Label>Available from</Label>
            <Input type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />
          </div>
          <div>
            <Label>Available until (optional)</Label>
            <Input type="date" value={form.availableTo} onChange={(e) => set("availableTo", e.target.value)} />
          </div>
          <div>
            <Label>Duration (months)</Label>
            <Input type="number" value={form.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} />
          </div>
          <div>
            <Label>Hours per week (override)</Label>
            <Input
              type="number"
              value={form.weeklyHours}
              onChange={(e) => set("weeklyHours", e.target.value)}
              placeholder="Auto from weekly availability"
            />
            <p className="mt-1 text-[11px] text-stone-400">
              Auto-filled from your weekly availability when days are set.
            </p>
          </div>
          <div>
            <Label>Min pocket money (R/wk)</Label>
            <Input type="number" value={form.pocketMoneyMin} onChange={(e) => set("pocketMoneyMin", e.target.value)} />
          </div>
          <div>
            <Label>Work rights / visa</Label>
            <Select value={form.workRights} onChange={(e) => set("workRights", e.target.value)}>
              <option value="">Select…</option>
              <option value="CITIZEN">Citizen / permanent resident</option>
              <option value="PERMIT">Valid work permit</option>
              <option value="SEEKING">Seeking visa / sponsorship</option>
              <option value="UNKNOWN">Prefer not to say</option>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={form.willingRelocate}
            onChange={(e) => set("willingRelocate", e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-teal-600"
          />
          Willing to relocate within SA
        </label>
        <div>
          <Label>Certificates</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {["First aid", "CPR", "Police clearance", "Driver's licence", "Teaching cert"].map((c) => (
              <ChipToggle
                key={c}
                label={c}
                selected={form.certificates.includes(c)}
                onClick={() => toggle("certificates", c)}
              />
            ))}
          </div>
        </div>
        <div>
          <Label>Preferred host countries</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((c) => (
              <ChipToggle
                key={c}
                label={c}
                selected={form.preferredCountries.includes(c)}
                onClick={() => toggle("preferredCountries", c)}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Weekly availability</h2>
          <p className="mt-1 text-sm text-stone-500">
            Select the days and times you are typically free to work. Families see this on your
            profile. For one-off dates (holidays, travel), also use{" "}
            <a href="/availability" className="font-semibold text-teal-700 hover:underline">
              Availability calendar
            </a>
            .
          </p>
        </div>
        <ScheduleEditor value={schedule} onChange={setSchedule} mode="aupair" />
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
