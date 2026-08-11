"use client";

import { useEffect, useState } from "react";
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
  LANGUAGE_OPTIONS,
  SKILL_OPTIONS,
} from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/locations";
import { Loader2, CheckCircle2, MapPin, Plus, X } from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";
import { GalleryEditor } from "@/components/gallery-editor";
import { ScheduleEditor } from "@/components/schedule-editor";
import { LocationFields, type LocationValue } from "@/components/location-fields";
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
import { CompletenessCoach } from "@/components/completeness-coach";
import { QualificationsEditor } from "@/components/qualifications-editor";
import {
  parseQualifications,
  serializeQualifications,
  STUDY_STATUS_OPTIONS,
  type QualificationItem,
} from "@/lib/qualifications";

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
  studyStatus?: string;
  studyingTowards?: string;
  qualifications?: QualificationItem[] | string | null;
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
  region: string;
  country: string;
  continent: string;
  workRights: string;
  willingRelocate: boolean;
  relocateCities: string[];
  certificates: string[];
  scheduleJson?: string | null;
  services?: string | ServiceId[] | null;
  petTypes?: string[];
  houseSittingNotes?: string;
  openToPeerConnect?: boolean;
  peerIntro?: string;
  photos?: string[];
  coverImage?: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  /** Completeness coach extras (from server) */
  isVerified?: boolean;
  documentCount?: number;
  referenceCount?: number;
  videoIntroUrl?: string | null;
};

const AUPAIR_SECTIONS = [
  { id: "services", label: "Services" },
  { id: "photos", label: "Photos" },
  { id: "basics", label: "Basics" },
  { id: "qualifications", label: "Qualifications" },
  { id: "languages", label: "Languages" },
  { id: "skills", label: "Skills" },
  { id: "location", label: "Where you are" },
  { id: "work-areas", label: "Where you'll work" },
  { id: "community", label: "AuPair Connect" },
  { id: "availability", label: "Availability" },
  { id: "schedule", label: "Schedule" },
];

export function AuPairProfileForm({
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
  const [documentCount, setDocumentCount] = useState(initial.documentCount ?? 0);
  const [referenceCount] = useState(initial.referenceCount ?? 0);
  const [qualifications, setQualifications] = useState<QualificationItem[]>(() =>
    Array.isArray(initial.qualifications)
      ? initial.qualifications
      : parseQualifications(
          typeof initial.qualifications === "string" ? initial.qualifications : "[]"
        )
  );
  /** Draft location for multi-select “willing to work” places */
  const [workLocDraft, setWorkLocDraft] = useState<LocationValue>({
    continent: "",
    country: "",
    region: "",
    city: "",
  });
  const [workLocCustom, setWorkLocCustom] = useState("");

  // Keep document count accurate if user uploaded docs in another tab
  useEffect(() => {
    let cancelled = false;
    fetch("/api/documents", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && Array.isArray(d.documents)) {
          setDocumentCount(d.documents.length);
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function formatWorkPlace(loc: LocationValue): string {
    return [loc.city, loc.region, loc.country].filter(Boolean).join(", ");
  }

  function addWorkLocation() {
    const label =
      workLocCustom.trim() ||
      formatWorkPlace(workLocDraft);
    if (!label) return;
    if (!form.relocateCities.includes(label)) {
      set("relocateCities", [...form.relocateCities, label]);
    }
    // Prefer countries list stays in sync
    if (workLocDraft.country && !form.preferredCountries.includes(workLocDraft.country)) {
      set("preferredCountries", [...form.preferredCountries, workLocDraft.country]);
    }
    set("willingRelocate", true);
    setWorkLocDraft({ continent: workLocDraft.continent, country: workLocDraft.country, region: "", city: "" });
    setWorkLocCustom("");
  }

  function removeWorkLocation(label: string) {
    set(
      "relocateCities",
      form.relocateCities.filter((x) => x !== label)
    );
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
          services,
          petTypes,
          houseSittingNotes,
          qualifications: serializeQualifications(qualifications),
          studyStatus: form.studyStatus || null,
          studyingTowards: form.studyingTowards || null,
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
      <CompletenessCoach
        variant="compact"
        input={{
          role: "AUPAIR",
          name: form.name,
          image,
          headline: form.headline,
          bio: form.bio,
          city: form.city,
          country: form.country,
          languages: form.languages,
          services,
          status: form.status,
          isVerified: Boolean(initial.isVerified),
          videoIntroUrl: initial.videoIntroUrl,
          experienceYears: form.experienceYears
            ? Number(form.experienceYears)
            : 0,
          pocketMoneyMin: form.pocketMoneyMin
            ? Number(form.pocketMoneyMin)
            : null,
          availableFrom: form.availableFrom || null,
          workRights: form.workRights,
          photos: form.photos || initial.photos || [],
          documentCount,
          referenceCount,
        }}
      />

      <ProfileSection id="services">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Services you offer</h2>
        <ServicePicker
          mode="provider"
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
          name={form.name || "Au pair"}
          currentImage={image}
          onUploaded={(url) => {
            setImage(url);
            router.refresh();
          }}
        />
      </Card>

      <Card className="mt-5 space-y-4 sm:mt-6">
        <h2 className="font-display text-lg font-semibold">Gallery photos</h2>
        <p className="text-sm text-stone-500">
          Add more photos of yourself (with kids, activities, travel). Each upload is saved
          immediately to your listing (up to 12).
        </p>
        <GalleryEditor
          name={form.name || "Au pair"}
          initialPhotos={initial.photos || []}
        />
      </Card>
      </ProfileSection>

      <ProfileSection id="basics">
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
            <Label>Highest education (summary)</Label>
            <Input
              value={form.education}
              onChange={(e) => set("education", e.target.value)}
              placeholder="e.g. Matric, ECD diploma, BEd"
            />
          </div>
        </div>
      </Card>
      </ProfileSection>

      <ProfileSection id="qualifications">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Qualifications &amp; studies
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Tell hosts what you have completed and what you are studying towards.
            Attach certificates or proof as PDF/image — files also go into your
            private document vault.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Study status</Label>
            <Select
              value={form.studyStatus || ""}
              onChange={(e) => set("studyStatus", e.target.value)}
            >
              <option value="">Select…</option>
              {STUDY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Studying towards (if applicable)</Label>
            <Input
              value={form.studyingTowards || ""}
              onChange={(e) => set("studyingTowards", e.target.value)}
              placeholder="e.g. BEd Foundation Phase, Nursing auxiliary"
              disabled={form.studyStatus === "NOT_STUDYING"}
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Qualifications list</Label>
          <QualificationsEditor
            items={qualifications}
            onChange={setQualifications}
          />
        </div>

        <div>
          <Label>Quick certificate chips</Label>
          <p className="mt-0.5 text-xs text-stone-400">
            Tap to flag common certs (add full details above if you have files).
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "First aid",
              "CPR",
              "Police clearance",
              "Driver's licence",
              "Teaching cert",
              "ECD / childcare cert",
              "Au pair training",
            ].map((c) => (
              <ChipToggle
                key={c}
                label={c}
                selected={form.certificates.includes(c)}
                onClick={() => toggle("certificates", c)}
              />
            ))}
          </div>
        </div>
      </Card>
      </ProfileSection>

      <ProfileSection id="languages">
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
      </ProfileSection>

      <ProfileSection id="skills">
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
      </ProfileSection>

      <ProfileSection id="location">
      <Card className="space-y-4">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <div>
            <h2 className="font-display text-lg font-semibold">Where you are now</h2>
            <p className="mt-1 text-sm text-stone-500">
              Your current base — hosts and AuPair Connect use this for local matches.
            </p>
          </div>
        </div>
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
      </Card>
      </ProfileSection>

      <ProfileSection id="work-areas">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Where you&apos;ll work</h2>
          <p className="mt-1 text-sm text-stone-500">
            Select every place you are willing and able to work — not only where you live now.
            Hosts filter by these areas worldwide.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-3 py-3 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={form.willingRelocate}
            onChange={(e) => set("willingRelocate", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-teal-600"
          />
          <span>
            <span className="font-semibold">Open to relocating / working in other places</span>
            <span className="mt-0.5 block text-stone-500">
              Turn on if you can move or take placements outside your current city.
            </span>
          </span>
        </label>

        <div>
          <Label>Preferred countries (multi-select)</Label>
          <p className="mb-2 text-xs text-stone-500">
            Tap all countries you can work in. Used in host search filters.
          </p>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((c) => (
              <ChipToggle
                key={c}
                label={c}
                selected={form.preferredCountries.includes(c)}
                onClick={() => {
                  toggle("preferredCountries", c);
                  if (!form.preferredCountries.includes(c)) {
                    set("willingRelocate", true);
                  }
                }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
          <Label>Preferred cities / regions (add as many as you like)</Label>
          <p className="mb-3 text-xs text-stone-500">
            e.g. Cape Town, London, NYC, Bali — specific places you want placements.
          </p>

          {form.relocateCities.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2">
              {form.relocateCities.map((place) => (
                <li
                  key={place}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-teal-900 shadow-sm ring-1 ring-teal-200"
                >
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  {place}
                  <button
                    type="button"
                    onClick={() => removeWorkLocation(place)}
                    className="rounded-full p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                    aria-label={`Remove ${place}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <LocationFields
            value={workLocDraft}
            onChange={setWorkLocDraft}
            cityLabel="City / town you want to work in"
          />
          <div className="mt-3">
            <Label>Or type a place freely</Label>
            <Input
              value={workLocCustom}
              onChange={(e) => setWorkLocCustom(e.target.value)}
              placeholder="e.g. Stellenbosch, Western Cape · or remote/flexible"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addWorkLocation();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={addWorkLocation}
          >
            <Plus className="h-4 w-4" />
            Add work location
          </Button>
        </div>
      </Card>
      </ProfileSection>

      <ProfileSection id="community">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">AuPair Connect</h2>
        <p className="text-sm text-stone-500">
          Meet other sitters in your area — great when you&apos;re abroad and looking for
          friends, not just a host family.
        </p>
        <label className="flex items-start gap-3 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={form.openToPeerConnect !== false}
            onChange={(e) => set("openToPeerConnect", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-teal-600"
          />
          <span>
            <span className="font-semibold">Show me in AuPair Connect</span>
            <span className="mt-0.5 block text-stone-500">
              Other sitters nearby can say hi and connect as friends.
            </span>
          </span>
        </label>
        <div>
          <Label>Friend intro (optional)</Label>
          <Textarea
            value={form.peerIntro || ""}
            onChange={(e) => set("peerIntro", e.target.value)}
            placeholder="e.g. New in Cape Town from Spain — love coffee, beach walks & weekend markets"
            maxLength={280}
          />
        </div>
      </Card>
      </ProfileSection>

      <ProfileSection id="availability">
      <Card className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Availability & preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
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
      </Card>
      </ProfileSection>

      <ProfileSection id="schedule">
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
        role="AUPAIR"
        title="Edit your services & profile"
        description="Offer au pair / childcare, tutoring, house sitting, dog/pet sitting — or a mix."
        status={form.status}
        userName={userName || form.name}
        sections={AUPAIR_SECTIONS}
        actions={actions}
      >
        {body}
      </ProfileEditShell>
    );
  }

  return body;
}
