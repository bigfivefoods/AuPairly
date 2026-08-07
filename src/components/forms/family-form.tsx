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
  DUTY_OPTIONS,
  LANGUAGE_OPTIONS,
  OFFER_OPTIONS,
} from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";
import { ScheduleEditor } from "@/components/schedule-editor";
import { LocationFields } from "@/components/location-fields";
import {
  computeWeeklyHours,
  parseSchedule,
  serializeSchedule,
  type RecurringSchedule,
} from "@/lib/schedule";
import { continentForCountry } from "@/lib/locations";
import { parseServices, type ServiceId } from "@/lib/services";
import { ServicePicker } from "@/components/service-picker";
import {
  ProfileEditShell,
  ProfileSection,
} from "@/components/profile/profile-edit-shell";

type Initial = {
  name: string;
  phone: string;
  image?: string | null;
  headline: string;
  bio: string;
  familyName: string;
  city: string;
  region: string;
  country: string;
  continent: string;
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
  schoolArea: string;
  drivingRequired: boolean;
  lifestyleNotes: string;
  scheduleJson?: string | null;
  services?: string | ServiceId[] | null;
  petTypes?: string[];
  houseSittingNotes?: string;
  /** Comma-separated or free text for multi care locations */
  preferredAreas?: string;
  isUrgent?: boolean;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
};

const FAMILY_SECTIONS = [
  { id: "services", label: "Services" },
  { id: "photos", label: "Photos" },
  { id: "basics", label: "Family basics" },
  { id: "children", label: "Children" },
  { id: "location", label: "Location" },
  { id: "languages", label: "Languages" },
  { id: "role", label: "The role" },
  { id: "schedule", label: "Schedule" },
];

export function FamilyProfileForm({
  initial,
  fullscreen = false,
  userName,
}: {
  initial: Initial;
  fullscreen?: boolean;
  userName?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [image, setImage] = useState(initial.image || "");
  const [ageInput, setAgeInput] = useState("");
  const [schedule, setSchedule] = useState<RecurringSchedule>(() =>
    parseSchedule(initial.scheduleJson)
  );
  const [services, setServices] = useState<ServiceId[]>(() =>
    Array.isArray(initial.services)
      ? (initial.services as ServiceId[])
      : parseServices(
          typeof initial.services === "string" ? initial.services : null
        )
  );
  const [petTypes, setPetTypes] = useState<string[]>(initial.petTypes || []);
  const [houseSittingNotes, setHouseSittingNotes] = useState(
    initial.houseSittingNotes || ""
  );
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
      const computedHours = computeWeeklyHours(schedule);
      const hasScheduleDays = schedule.days.some((d) => d.enabled);
      const weeklyHours =
        hasScheduleDays && computedHours > 0
          ? String(Math.round(computedHours))
          : form.weeklyHours;

      const res = await fetch("/api/profiles/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weeklyHours,
          scheduleJson: serializeSchedule(schedule),
          services,
          petTypes,
          houseSittingNotes,
          status: status ?? form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setMessage(status === "ACTIVE" ? "Listing published!" : "Saved successfully.");
      if (status) setForm((f) => ({ ...f, status }));
      if (hasScheduleDays) setForm((f) => ({ ...f, weeklyHours }));
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const actions = (
    <>
      <Button onClick={() => save()} disabled={loading} className="!px-3 sm:!px-5">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save draft
      </Button>
      <Button
        variant="accent"
        onClick={() => save("ACTIVE")}
        disabled={loading}
        className="!px-3 sm:!px-5"
      >
        Publish
      </Button>
      {form.status === "ACTIVE" && (
        <Button
          variant="secondary"
          onClick={() => save("PAUSED")}
          disabled={loading}
          className="!px-3 sm:!px-5"
        >
          Pause
        </Button>
      )}
    </>
  );

  const body = (
    <div className="space-y-5 sm:space-y-6">
      <ProfileSection id="services">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Services you need</h2>
        <ServicePicker
          mode="host"
          value={services}
          onChange={setServices}
          petTypes={petTypes}
          onPetTypesChange={setPetTypes}
          houseNotes={houseSittingNotes}
          onHouseNotesChange={setHouseSittingNotes}
        />
      </Card>
      </ProfileSection>

      <ProfileSection id="photos">
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

      <Card className="mt-5 space-y-4 sm:mt-6">
        <h2 className="font-display text-lg font-semibold">Home gallery</h2>
        <p className="text-sm text-stone-500">
          Photos of your home and family life (no full address visible). Stored on Supabase when configured.
        </p>
        <PhotoUpload
          name={form.familyName || form.name || "Family"}
          kind="gallery"
          onUploaded={() => router.refresh()}
        />
      </Card>
      </ProfileSection>

      <ProfileSection id="basics">
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

      </ProfileSection>

      <ProfileSection id="children">
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

      </ProfileSection>

      <ProfileSection id="location">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Location (worldwide)</h2>
        <p className="text-sm text-stone-500">
          Continent → country → province/state → city. Au pairs search by any of these levels.
        </p>
        <LocationFields
          value={{
            continent: form.continent || continentForCountry(form.country) || "",
            country: form.country,
            region: form.region,
            city: form.city,
          }}
          onChange={(loc) =>
            setForm((f) => ({
              ...f,
              continent: loc.continent,
              country: loc.country,
              region: loc.region,
              city: loc.city,
            }))
          }
        />
        <div>
          <Label>Neighborhood / area (no full street address)</Label>
          <Input
            value={form.addressArea}
            onChange={(e) => set("addressArea", e.target.value)}
            placeholder="e.g. Park Slope, Sandton, Paddington"
          />
        </div>
        <div>
          <Label>Other areas where you need care (optional)</Label>
          <p className="mb-2 text-xs text-stone-500">
            Comma-separated cities or neighborhoods if care is needed in more than one place.
          </p>
          <Input
            value={form.preferredAreas || ""}
            onChange={(e) => set("preferredAreas", e.target.value)}
            placeholder="e.g. Stellenbosch, Camps Bay, Umhlanga"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={Boolean(form.isUrgent)}
            onChange={(e) => set("isUrgent", e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-teal-600"
          />
          Mark as urgent need (shown as a badge to sitters)
        </label>
      </Card>

      </ProfileSection>

      <ProfileSection id="languages">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Languages at home</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <ChipToggle key={l} label={l} selected={form.languages.includes(l)} onClick={() => toggle("languages", l)} />
          ))}
        </div>
      </Card>

      </ProfileSection>

      <ProfileSection id="role">
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
            <Label>Hours per week (override)</Label>
            <Input
              type="number"
              value={form.weeklyHours}
              onChange={(e) => set("weeklyHours", e.target.value)}
              placeholder="Auto from schedule if set"
            />
            <p className="mt-1 text-[11px] text-stone-400">
              Filled automatically from the recurring schedule when days are enabled.
            </p>
          </div>
          <div>
            <Label>Pocket money (R/wk)</Label>
            <Input type="number" value={form.pocketMoney} onChange={(e) => set("pocketMoney", e.target.value)} />
          </div>
          <div>
            <Label>School / area for school runs</Label>
            <Input
              value={form.schoolArea}
              onChange={(e) => set("schoolArea", e.target.value)}
              placeholder="e.g. Rondebosch / near Bishops"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["liveIn", "Live-in arrangement"],
              ["ownRoom", "Private room for au pair"],
              ["carProvided", "Car provided"],
              ["drivingRequired", "Driving required for role"],
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
        <div>
          <Label>Lifestyle / day-in-the-life notes</Label>
          <Textarea
            value={form.lifestyleNotes}
            onChange={(e) => set("lifestyleNotes", e.target.value)}
            placeholder="Morning routines, neighbourhood feel, what weekends look like…"
          />
        </div>
      </Card>

      </ProfileSection>

      <ProfileSection id="schedule">
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Recurring schedule</h2>
          <p className="mt-1 text-sm text-stone-500">
            Tell au pairs which days and hours you need every week (or alternating weeks).
            This shows on your public listing.
          </p>
        </div>
        <ScheduleEditor value={schedule} onChange={setSchedule} />
      </Card>
      </ProfileSection>

      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </p>
      )}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!fullscreen && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );

  if (fullscreen) {
    return (
      <ProfileEditShell
        role="PARENT"
        title="Edit what you need"
        description="Request childcare / au pair, house sitting, pet sitting — or a combination."
        status={form.status}
        userName={userName || form.name}
        sections={FAMILY_SECTIONS}
        actions={actions}
      >
        {body}
      </ProfileEditShell>
    );
  }

  return body;
}
