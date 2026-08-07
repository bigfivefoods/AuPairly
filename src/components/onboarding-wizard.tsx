"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Home,
  HandHeart,
} from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { ServicePicker } from "@/components/service-picker";
import { LocationFields } from "@/components/location-fields";
import { SERVICE_LIST, type ServiceId } from "@/lib/services";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "services",
    title: "Services",
    blurb: "Pick every category that applies — you can combine care types.",
  },
  {
    id: "location",
    title: "Location",
    blurb: "Matches are strongest when we know where you are.",
  },
  {
    id: "live",
    title: "Go live",
    blurb: "Add a headline and publish when you're ready.",
  },
] as const;

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
  const progress = ((step + 1) / STEPS.length) * 100;
  const current = STEPS[step];

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

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
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void finish();
  }

  // Keep sticky site navbar visible for easy site navigation
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-[#faf8f5] text-stone-900 top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))]">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Brand rail — full height on desktop */}
        <aside className="relative shrink-0 overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 px-5 py-5 text-white sm:px-8 sm:py-6 lg:flex lg:w-[40%] lg:max-w-xl lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-200/90">
                Getting started
              </p>
              <Link
                href="/dashboard"
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-white/20 lg:hidden"
              >
                Skip
              </Link>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-100">
              <Sparkles className="h-3.5 w-3.5" />
              {isHost ? "Host setup" : "Sitter setup"}
            </p>
            <h1 className="mt-3 max-w-md font-display text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
              Welcome, {first}
            </h1>
            <p className="mt-2 max-w-sm text-sm text-teal-100/90 lg:text-base">
              {isHost
                ? "Tell us what care you need and where — under 2 minutes."
                : "Tell us what you offer and where — under 2 minutes."}
            </p>

            <ol className="relative mt-8 hidden lg:block">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={s.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {i < STEPS.length - 1 && (
                      <span
                        className={cn(
                          "absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px",
                          done ? "bg-teal-300/80" : "bg-white/20"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done && "bg-teal-300 text-teal-900",
                        active && "bg-white text-teal-800 ring-4 ring-white/25",
                        !done && !active && "bg-white/15 text-white/70"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="pt-0.5">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          active ? "text-white" : "text-white/75"
                        )}
                      >
                        {s.title}
                      </p>
                      <p className="mt-0.5 text-xs text-teal-100/70">{s.blurb}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="relative mt-6 hidden text-xs text-teal-200/70 lg:block">
            Step {step + 1} of {STEPS.length} · refine anytime in Edit profile
          </p>
        </aside>

        {/* Form column */}
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#faf8f5]">
          {/* Mobile progress */}
          <div className="shrink-0 border-b border-stone-200/80 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-stone-500">
              <span>
                Step {step + 1} / {STEPS.length}
              </span>
              <span className="text-teal-700">{current.title}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => i <= step && setStep(i)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    i === step && "bg-teal-600 text-white",
                    i < step && "bg-teal-50 text-teal-800",
                    i > step && "bg-stone-100 text-stone-400"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/70 px-8 py-4 backdrop-blur lg:flex xl:px-12">
            <div className="flex items-center gap-3">
              {isHost ? (
                <Home className="h-5 w-5 text-teal-600" />
              ) : (
                <HandHeart className="h-5 w-5 text-teal-600" />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  {current.title}
                </p>
                <p className="mt-0.5 text-sm text-stone-500">{current.blurb}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-stone-200 xl:w-56">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-stone-500 hover:text-stone-800"
              >
                Skip for now
              </Link>
            </div>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-12">
            <div className="mx-auto w-full max-w-2xl xl:max-w-3xl">
              <h2 className="mb-1 font-display text-xl font-semibold text-stone-900 sm:text-2xl lg:text-3xl">
                {step === 0
                  ? isHost
                    ? "What do you need help with?"
                    : "What do you offer?"
                  : current.title}
              </h2>
              <p className="mb-6 text-sm text-stone-500 sm:text-base">{current.blurb}</p>

              {step === 0 && (
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-[var(--shadow)] sm:p-6">
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
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-[var(--shadow)] sm:p-6">
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
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-[var(--shadow)] sm:p-6">
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
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8 xl:px-12">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 xl:max-w-3xl">
              <Button
                type="button"
                variant="secondary"
                disabled={step === 0 || loading}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="!px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                type="button"
                onClick={next}
                disabled={loading}
                className="min-w-[9rem] sm:min-w-[10.5rem]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step < STEPS.length - 1 ? (
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
          </div>
        </section>
      </div>
    </div>
  );
}
