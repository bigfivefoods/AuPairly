"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { ServicePicker } from "@/components/service-picker";
import { LocationFields } from "@/components/location-fields";
import { SERVICE_LIST, type ServiceId } from "@/lib/services";
import { cn } from "@/lib/utils";

export function OnboardingWizard({
  role,
  name,
}: {
  role: "AUPAIR" | "PARENT";
  name: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceId[]>(["CHILDCARE"]);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [continent, setContinent] = useState("");
  const [headline, setHeadline] = useState("");
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const first = name.split(" ")[0] || "there";
  const isHost = role === "PARENT";

  async function finish() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services,
          city,
          country,
          region: region || null,
          headline: headline || null,
          publish,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return;
      }
      router.push(data.next || "/dashboard");
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    setError("");
    if (step === 0 && services.length === 0) {
      setError("Pick at least one service");
      return;
    }
    if (step === 1 && (!city.trim() || !country.trim())) {
      setError("City and country are required");
      return;
    }
    if (step < 2) setStep((s) => s + 1);
    else void finish();
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Welcome, {first}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
          {isHost ? "What do you need help with?" : "What do you offer?"}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Takes under 2 minutes. You can refine details anytime in Edit profile.
        </p>
      </div>

      {/* Steps */}
      <ol className="mb-8 flex gap-2">
        {["Services", "Location", "Go live"].map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              i === step
                ? "bg-teal-600 text-white"
                : i < step
                  ? "bg-teal-50 text-teal-800"
                  : "bg-stone-100 text-stone-400"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Select every category that applies — many people combine childcare with pets or
            house sitting.
          </p>
          <ServicePicker
            mode={isHost ? "host" : "provider"}
            value={services}
            onChange={setServices}
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {SERVICE_LIST.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2 text-xs text-stone-500"
              >
                <span className="font-semibold text-stone-700">{s.shortName}:</span>{" "}
                {s.examples.slice(0, 3).join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Matches are strongest when we know where you are (or where you need care).
          </p>
          <LocationFields
            value={{ city, region, country, continent }}
            onChange={(next) => {
              setCity(next.city);
              setRegion(next.region);
              setCountry(next.country);
              setContinent(next.continent);
            }}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="headline">Headline (optional)</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={
                isHost
                  ? "e.g. Family in Cape Town needs after-school care"
                  : "e.g. Experienced sitter for kids & pets"
              }
              maxLength={120}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <input
              type="checkbox"
              className="mt-1"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold text-stone-800">
                Publish my listing as Active
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">
                You&apos;ll still need a photo and fuller bio to unlock Discover and boosts.
              </span>
            </span>
          </label>
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-900">
            <p className="font-semibold">Next after this</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-teal-800/90">
              <li>Add a clear photo</li>
              <li>Write a real bio</li>
              <li>Get verified (ID + selfie)</li>
            </ol>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          className="text-sm font-medium text-stone-500 hover:text-stone-800 disabled:opacity-40"
          disabled={step === 0 || loading}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <Button type="button" onClick={next} disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : step < 2 ? (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Finish setup <Check className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
