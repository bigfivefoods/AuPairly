"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MapPin, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type Preview = {
  city: string;
  sitters: number;
  hosts: number;
  matchCount: number;
  thin: boolean;
  samples: string[];
  cta: string;
  registerHref?: string;
  browseHref?: string;
};

export function CityMatchTeaser({
  variant = "home",
  defaultRole = "PARENT",
  defaultCity = "",
  className,
}: {
  variant?: "home" | "register" | "compact";
  defaultRole?: "PARENT" | "AUPAIR";
  defaultCity?: string;
  className?: string;
}) {
  const [role, setRole] = useState<"PARENT" | "AUPAIR">(defaultRole);
  const [city, setCity] = useState(defaultCity);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    const c = city.trim();
    if (c.length < 2) {
      setError("Enter a city (e.g. Cape Town)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/public/city-preview?city=${encodeURIComponent(c)}&role=${role}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load");
        return;
      }
      setPreview(data);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }, [city, role]);

  const isHome = variant === "home";

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm",
        isHome
          ? "border-white/20 bg-white/10 p-4 text-white backdrop-blur sm:p-5"
          : "border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            isHome ? "text-amber-300" : "text-teal-600"
          )}
        />
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isHome ? "text-white" : "text-stone-900"
            )}
          >
            See who’s in your city — free
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              isHome ? "text-teal-100/90" : "text-stone-500"
            )}
          >
            No account needed. Preview matches, then join in under a minute.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setRole("PARENT")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition",
            role === "PARENT"
              ? isHome
                ? "bg-white text-teal-900"
                : "bg-teal-700 text-white"
              : isHome
                ? "bg-white/10 text-teal-50 hover:bg-white/20"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          I need care (host)
        </button>
        <button
          type="button"
          onClick={() => setRole("AUPAIR")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition",
            role === "AUPAIR"
              ? isHome
                ? "bg-white text-teal-900"
                : "bg-teal-700 text-white"
              : isHome
                ? "bg-white/10 text-teal-50 hover:bg-white/20"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          I offer care (sitter)
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <MapPin
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              isHome ? "text-teal-200" : "text-stone-400"
            )}
          />
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void run();
              }
            }}
            placeholder="City (e.g. Cape Town, Sandton)"
            className={cn(
              "pl-9",
              isHome &&
                "!border-white/30 !bg-white/15 !text-white placeholder:!text-teal-100/60"
            )}
          />
        </div>
        <Button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className={cn(isHome && "!bg-amber-400 !text-stone-900 hover:!bg-amber-300")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Check city
        </Button>
      </div>

      {error && (
        <p
          className={cn(
            "mt-2 text-xs",
            isHome ? "text-amber-200" : "text-red-600"
          )}
        >
          {error}
        </p>
      )}

      {preview && (
        <div
          className={cn(
            "mt-4 rounded-xl border p-3",
            isHome
              ? "border-white/20 bg-black/20"
              : "border-teal-100 bg-white"
          )}
        >
          <p
            className={cn(
              "font-display text-2xl font-semibold tabular-nums",
              isHome ? "text-white" : "text-teal-900"
            )}
          >
            {preview.matchCount}
            <span className="ml-1 text-sm font-medium opacity-80">
              {role === "PARENT" ? "sitters" : "hosts"} in {preview.city || "city"}
            </span>
          </p>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              isHome ? "text-teal-50/90" : "text-stone-600"
            )}
          >
            {preview.cta}
          </p>
          {preview.samples.length > 0 && (
            <ul
              className={cn(
                "mt-2 space-y-1 text-[11px]",
                isHome ? "text-teal-100/80" : "text-stone-500"
              )}
            >
              {preview.samples.map((s, i) => (
                <li key={i} className="truncate">
                  · {s}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={
                preview.registerHref ||
                `/register?role=${role}${city ? `&city=${encodeURIComponent(city)}` : ""}`
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold",
                isHome
                  ? "bg-white text-teal-900"
                  : "bg-teal-700 text-white"
              )}
            >
              Join free to connect
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {preview.browseHref && preview.matchCount > 0 && (
              <Link
                href={preview.browseHref}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold",
                  isHome
                    ? "border border-white/30 text-white"
                    : "border border-stone-200 text-stone-700"
                )}
              >
                Browse listings
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
