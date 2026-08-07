"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  computeCompleteness,
  type CompletenessInput,
} from "@/lib/completeness";
import { MIN_DISCOVER_PERCENT } from "@/lib/gates";
import { cn } from "@/lib/utils";

/**
 * Highly visible profile completion progress + full checklist to 100%.
 */
export function CompletenessCoach({
  input,
  variant = "full",
  defaultExpanded,
}: {
  input: CompletenessInput;
  /** full = dashboard; compact = sticky strip on edit */
  variant?: "full" | "compact";
  defaultExpanded?: boolean;
}) {
  const c = useMemo(() => computeCompleteness(input), [input]);
  const [showAll, setShowAll] = useState(
    defaultExpanded ?? (variant === "full" && c.percent < 100)
  );

  const tone =
    c.percent >= 100
      ? "emerald"
      : c.percent >= MIN_DISCOVER_PERCENT
        ? "teal"
        : c.percent >= 40
          ? "amber"
          : "rose";

  const barClass =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "teal"
        ? "bg-teal-600"
        : tone === "amber"
          ? "bg-amber-500"
          : "bg-rose-500";

  const ringClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "teal"
        ? "text-teal-800"
        : tone === "amber"
          ? "text-amber-800"
          : "text-rose-800";

  const borderClass =
    tone === "emerald"
      ? "border-emerald-200 from-emerald-50"
      : tone === "teal"
        ? "border-teal-200 from-teal-50"
        : tone === "amber"
          ? "border-amber-200 from-amber-50"
          : "border-rose-200 from-rose-50";

  const headline =
    c.percent >= 100
      ? "Profile complete — you're match-ready"
      : c.percent >= MIN_DISCOVER_PERCENT
        ? "Discover unlocked — finish for max visibility"
        : "Complete your profile to unlock Discover";

  const subline =
    c.percent >= 100
      ? "Keep messages warm and stay active."
      : c.pending.length === 0
        ? "You're done!"
        : `${c.doneCount} of ${c.totalCount} steps done · ${c.remainingPoints} points to 100%`;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-2xl border bg-gradient-to-r to-white px-4 py-3 shadow-sm",
          borderClass
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className={cn("text-sm font-bold", ringClass)}>
                Profile {c.percent}% complete
              </p>
              <p className="text-xs text-stone-500">
                {c.doneCount}/{c.totalCount} steps
              </p>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-200/80">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barClass)}
                style={{ width: `${c.percent}%` }}
              />
            </div>
            {c.percent < MIN_DISCOVER_PERCENT && (
              <p className="mt-1.5 text-[11px] font-medium text-stone-600">
                Reach {MIN_DISCOVER_PERCENT}% to unlock Discover (
                {Math.max(0, MIN_DISCOVER_PERCENT - c.percent)}% to go)
              </p>
            )}
          </div>
          {c.nextThree[0] && (
            <Link
              href={c.nextThree[0].href}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Next: {c.nextThree[0].label.split(" ").slice(0, 3).join(" ")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {c.pending.length > 0 && (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {c.pending.slice(0, 4).map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="flex items-start gap-2 rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 text-xs hover:border-teal-300"
                >
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-300" />
                  <span>
                    <span className="font-semibold text-stone-800">{a.label}</span>
                    <span className="ml-1 text-stone-400">+{a.points}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br to-white p-5 shadow-sm sm:p-6",
        borderClass
      )}
    >
      {/* Header + big % */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700">
            <Target className="h-3.5 w-3.5" />
            Profile completion
          </p>
          <h3 className={cn("mt-1 font-display text-2xl font-semibold sm:text-3xl", ringClass)}>
            {c.percent}%
            <span className="ml-2 text-base font-medium text-stone-500 sm:text-lg">
              complete
            </span>
          </h3>
          <p className="mt-1 text-sm font-medium text-stone-800">{headline}</p>
          <p className="mt-0.5 text-sm text-stone-500">{subline}</p>
        </div>

        {/* Circular meter */}
        <div className="relative mx-auto h-20 w-20 shrink-0 sm:mx-0 sm:h-24 sm:w-24">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="3.2"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={
                tone === "emerald"
                  ? "#10b981"
                  : tone === "teal"
                    ? "#0d9488"
                    : tone === "amber"
                      ? "#f59e0b"
                      : "#f43f5e"
              }
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray={`${c.percent}, 100`}
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-lg font-bold sm:text-xl",
              ringClass
            )}
          >
            {c.percent}
          </span>
        </div>
      </div>

      {/* Linear bar */}
      <div className="mt-4">
        <div className="relative h-3.5 overflow-hidden rounded-full bg-stone-200/90">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", barClass)}
            style={{ width: `${c.percent}%` }}
          />
          {/* 70% milestone marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-stone-800/30"
            style={{ left: `${MIN_DISCOVER_PERCENT}%` }}
            title={`${MIN_DISCOVER_PERCENT}% Discover unlock`}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          <span>0%</span>
          <span className="text-teal-700">{MIN_DISCOVER_PERCENT}% Discover</span>
          <span>100%</span>
        </div>
      </div>

      {/* Milestone pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Milestone
          ok={Boolean(input.image)}
          label="Photo"
        />
        <Milestone
          ok={Boolean(input.city && input.country)}
          label="Location"
        />
        <Milestone
          ok={input.status === "ACTIVE"}
          label="Published"
        />
        <Milestone
          ok={c.percent >= MIN_DISCOVER_PERCENT}
          label={`Discover ${MIN_DISCOVER_PERCENT}%+`}
        />
        <Milestone
          ok={Boolean(input.isVerified)}
          label="Verified"
        />
        <Milestone ok={c.percent >= 100} label="100%" />
      </div>

      {/* Next steps — always obvious */}
      {c.pending.length > 0 && (
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Do these next (biggest impact first)
          </p>
          <ul className="mt-2 space-y-2">
            {c.nextThree.map((a, i) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 shadow-sm transition hover:border-teal-400 hover:shadow"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900 group-hover:text-teal-900">
                        {a.label}
                      </span>
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        +{a.points} pts
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-500">{a.detail}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 group-hover:text-teal-600" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {c.percent >= 100 && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          You&apos;re at 100%. Open Discover and start matching.
        </p>
      )}

      {/* Full checklist toggle */}
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
      >
        {showAll ? (
          <>
            Hide full checklist <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            Show all {c.totalCount} steps to 100% <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {showAll && (
        <div className="mt-3 space-y-4 border-t border-stone-200/80 pt-4">
          {c.pending.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-700">
                Still to do ({c.pending.length})
              </p>
              <ul className="space-y-1.5">
                {c.pending.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={a.href}
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/80"
                    >
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-stone-300" />
                      <span className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-stone-800">{a.label}</span>
                        <span className="ml-1.5 text-[11px] font-semibold text-stone-400">
                          +{a.points}
                        </span>
                        <span className="block text-xs text-stone-500">{a.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {c.completed.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                Done ({c.completed.length})
              </p>
              <ul className="space-y-1">
                {c.completed.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 px-2 py-1 text-sm text-stone-500"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="line-through decoration-stone-300">{a.label}</span>
                    <span className="text-[11px] text-stone-400">+{a.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Milestone({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        ok
          ? "bg-emerald-100 text-emerald-800"
          : "bg-stone-100 text-stone-500"
      )}
    >
      {ok ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Circle className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}
