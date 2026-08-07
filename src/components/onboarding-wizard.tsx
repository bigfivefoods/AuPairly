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
  Camera,
  MapPin,
  Rocket,
} from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { ServicePicker } from "@/components/service-picker";
import { LocationFields } from "@/components/location-fields";
import { PhotoUpload } from "@/components/photo-upload";
import { type ServiceId } from "@/lib/services";
import { cn } from "@/lib/utils";

/** Ruthless path: photo → city → publish (services inline on go-live). */
const STEPS = [
  {
    id: "photo",
    title: "Photo",
    blurb: "A clear face photo gets far more messages. Required to continue.",
  },
  {
    id: "location",
    title: "City",
    blurb: "Where you are (or need care) — required for matches.",
  },
  {
    id: "live",
    title: "Go live",
    blurb: "Pick services, add a one-line headline, publish your listing.",
  },
] as const;

export function OnboardingWizard({
  role,
  name,
  initialImage,
}: {
  role: "AUPAIR" | "PARENT";
  name: string;
  initialImage?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(initialImage || "");
  const [services, setServices] = useState<ServiceId[]>(["CHILDCARE"]);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [continent, setContinent] = useState("");
  const [headline, setHeadline] = useState("");
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
    if (!image.trim()) {
      setError("Add a profile photo to go live.");
      setStep(0);
      setLoading(false);
      return;
    }
    if (!city.trim() || !country.trim()) {
      setError("City and country are required.");
      setStep(1);
      setLoading(false);
      return;
    }
    if (services.length === 0) {
      setError("Pick at least one service.");
      setLoading(false);
      return;
    }
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
          imageUrl: image,
          publish: true,
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
    if (step === 0 && !image.trim()) {
      setError("Add a clear profile photo to continue.");
      return;
    }
    if (step === 1 && (!city.trim() || !country.trim())) {
      setError("City and country are required.");
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else void finish();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col bg-[#faf8f5] text-stone-900 top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] lg:left-[var(--app-sidebar-w,11.5rem)]">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="relative shrink-0 overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 px-5 py-5 text-white sm:px-8 sm:py-6 lg:flex lg:w-[36%] lg:max-w-md lg:flex-col lg:justify-between lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-200/90">
              5-minute setup
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-100">
              <Sparkles className="h-3.5 w-3.5" />
              {isHost ? "Host setup" : "Sitter setup"}
            </p>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Welcome, {first}
            </h1>
            <p className="mt-2 text-sm text-teal-100/90">
              Photo → city → publish. You can refine everything later.
            </p>
            <ol className="mt-8 hidden space-y-4 lg:block">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const Icon = i === 0 ? Camera : i === 1 ? MapPin : Rocket;
                return (
                  <li key={s.id} className="flex gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done && "bg-teal-300 text-teal-900",
                        active && "bg-white text-teal-800",
                        !done && !active && "bg-white/15 text-white/70"
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className={cn("text-sm font-semibold", active ? "text-white" : "text-white/80")}>
                        {s.title}
                      </p>
                      <p className="text-xs text-teal-100/70">{s.blurb}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="relative mt-6 hidden text-xs text-teal-200/70 lg:block">
            Step {step + 1} of {STEPS.length}
          </p>
        </aside>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#faf8f5]">
          <div className="shrink-0 border-b border-stone-200/80 bg-white/80 px-4 py-3 sm:px-6">
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
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-2 flex items-center gap-2 text-teal-700">
                {isHost ? <Home className="h-5 w-5" /> : <HandHeart className="h-5 w-5" />}
                <h2 className="font-display text-xl font-semibold text-stone-900 sm:text-2xl">
                  {step === 0
                    ? "Add your photo"
                    : step === 1
                      ? "Where are you?"
                      : "Publish your listing"}
                </h2>
              </div>
              <p className="mb-6 text-sm text-stone-500">{current.blurb}</p>

              {step === 0 && (
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <PhotoUpload
                    name={name}
                    currentImage={image}
                    onUploaded={(url) => setImage(url)}
                    kind="avatar"
                  />
                  <p className="text-xs text-stone-500">
                    Use a clear, recent photo of your face. Logos and group shots convert poorly.
                  </p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
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
                <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div>
                    <Label>Services</Label>
                    <p className="mb-2 text-xs text-stone-500">
                      Select every category that applies.
                    </p>
                    <ServicePicker
                      mode={isHost ? "host" : "provider"}
                      value={services}
                      onChange={setServices}
                    />
                  </div>
                  <div>
                    <Label>Headline (optional)</Label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder={
                        isHost
                          ? "e.g. Family in Cape Town seeking reliable childcare"
                          : "e.g. Experienced sitter · Cape Town · bilingual"
                      }
                      maxLength={120}
                    />
                  </div>
                  <div className="rounded-xl bg-teal-50 px-3 py-3 text-sm text-teal-900">
                    <p className="font-semibold">You&apos;re publishing now</p>
                    <p className="mt-1 text-xs text-teal-800/90">
                      Your listing goes live so hosts and sitters can find you. You can edit
                      anytime. Verification still boosts trust afterward.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => (step > 0 ? setStep((s) => s - 1) : router.push("/dashboard"))}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft className="h-4 w-4" />
                {step > 0 ? "Back" : "Later"}
              </button>
              <Button type="button" onClick={next} disabled={loading} className="min-w-[9rem]">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {step < STEPS.length - 1 ? (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Publish listing <Rocket className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            {step === 0 && (
              <p className="mx-auto mt-2 max-w-xl text-center text-[11px] text-stone-400">
                Skipping photo is not allowed — it unlocks Discover and more messages.
              </p>
            )}
            <p className="mx-auto mt-1 max-w-xl text-center text-[11px] text-stone-400">
              <Link href="/dashboard" className="font-medium text-stone-500 underline">
                Exit setup
              </Link>{" "}
              (you can finish from the dashboard)
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
