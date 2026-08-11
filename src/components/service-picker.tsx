"use client";

import {
  ArrowLeftRight,
  Baby,
  BookOpen,
  HeartHandshake,
  Home,
  PawPrint,
} from "lucide-react";
import {
  PET_TYPE_OPTIONS,
  SERVICE_LIST,
  type ServiceId,
} from "@/lib/services";
import { cn } from "@/lib/utils";
import { ChipToggle, Input, Label, Textarea } from "@/components/ui";
import { useI18n } from "@/components/i18n-provider";
import { serviceLabel } from "@/lib/i18n/service-label";

const ICONS = {
  baby: Baby,
  book: BookOpen,
  heart: HeartHandshake,
  home: Home,
  swap: ArrowLeftRight,
  paw: PawPrint,
} as const;

export type HouseSwapFields = {
  swapAvailableFrom?: string;
  swapAvailableTo?: string;
  swapSeekingAreas?: string;
  swapHomeSummary?: string;
  swapSimultaneous?: boolean;
};

export function ServicePicker({
  mode,
  value,
  onChange,
  petTypes = [],
  onPetTypesChange,
  houseNotes = "",
  onHouseNotesChange,
  swap,
  onSwapChange,
}: {
  mode: "provider" | "host";
  value: ServiceId[];
  onChange: (next: ServiceId[]) => void;
  petTypes?: string[];
  onPetTypesChange?: (next: string[]) => void;
  houseNotes?: string;
  onHouseNotesChange?: (next: string) => void;
  swap?: HouseSwapFields;
  onSwapChange?: (next: HouseSwapFields) => void;
}) {
  const { dict } = useI18n();

  function toggle(id: ServiceId) {
    if (value.includes(id)) {
      if (value.length === 1) return; // keep at least one
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  }

  const showPets = value.includes("PET_SITTING");
  const showHouse = value.includes("HOUSE_SITTING");
  const showSwap = value.includes("HOUSE_SWAP") && onSwapChange;

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        {mode === "provider"
          ? "Select every service you offer. One profile can cover multiple categories."
          : "Select what you need. You can hire for one category or combine several — including house swap."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {SERVICE_LIST.map((s) => {
          const Icon = ICONS[s.icon];
          const on = value.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition",
                on
                  ? `${s.bg} border-current ${s.color} shadow-sm`
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold">{serviceLabel(dict, s.id)}</span>
              <span className="text-xs opacity-80 leading-snug">{s.tagline}</span>
              <span className="text-[11px] opacity-70 leading-snug">
                {s.examples.slice(0, 3).join(" · ")}
              </span>
            </button>
          );
        })}
      </div>

      {showPets && onPetTypesChange && (
        <div>
          <Label>
            {mode === "provider" ? "Pets you’re comfortable with" : "Pets that need care"}
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PET_TYPE_OPTIONS.map((p) => (
              <ChipToggle
                key={p}
                label={p}
                selected={petTypes.includes(p)}
                onClick={() =>
                  onPetTypesChange(
                    petTypes.includes(p)
                      ? petTypes.filter((x) => x !== p)
                      : [...petTypes, p]
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {showHouse && onHouseNotesChange && (
        <div>
          <Label>
            {mode === "provider"
              ? "House-sitting experience / notes"
              : "House-sitting details"}
          </Label>
          <Textarea
            value={houseNotes}
            onChange={(e) => onHouseNotesChange(e.target.value)}
            placeholder={
              mode === "provider"
                ? "e.g. Short/long stays, plants, property checks…"
                : "e.g. Holiday dates, plants, alarm process, mail…"
            }
          />
        </div>
      )}

      {showSwap && swap && onSwapChange && (
        <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
          <div>
            <p className="text-sm font-semibold text-violet-900">House swap details</p>
            <p className="mt-0.5 text-xs text-violet-800/80">
              Mutual exchange — not one-way sitting. Share when your home is free and where you’d
              like to go. Exact addresses stay private until shortlist.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Available from</Label>
              <Input
                type="date"
                value={swap.swapAvailableFrom || ""}
                onChange={(e) =>
                  onSwapChange({ ...swap, swapAvailableFrom: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Available to</Label>
              <Input
                type="date"
                value={swap.swapAvailableTo || ""}
                onChange={(e) =>
                  onSwapChange({ ...swap, swapAvailableTo: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label>Where do you want to swap into?</Label>
            <Input
              value={swap.swapSeekingAreas || ""}
              onChange={(e) =>
                onSwapChange({ ...swap, swapSeekingAreas: e.target.value })
              }
              placeholder="e.g. Cape Town, Durban, Johannesburg · or overseas"
            />
          </div>
          <div>
            <Label>Your home for swap (beds, guests, vibe)</Label>
            <Textarea
              value={swap.swapHomeSummary || ""}
              onChange={(e) =>
                onSwapChange({ ...swap, swapHomeSummary: e.target.value })
              }
              placeholder="e.g. 3-bed family home, sleeps 6, garden, near schools, Wi‑Fi…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={swap.swapSimultaneous !== false}
              onChange={(e) =>
                onSwapChange({ ...swap, swapSimultaneous: e.target.checked })
              }
              className="h-4 w-4 rounded border-stone-300 text-violet-600"
            />
            Prefer simultaneous swap (you stay in theirs while they stay in yours)
          </label>
        </div>
      )}
    </div>
  );
}

export function ServiceBadges({
  services,
  className,
}: {
  services: ServiceId[];
  className?: string;
}) {
  const { dict } = useI18n();
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {services.map((id) => {
        const s = SERVICE_LIST.find((x) => x.id === id);
        if (!s) return null;
        const Icon = ICONS[s.icon];
        return (
          <span
            key={id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              s.bg,
              s.color
            )}
          >
            <Icon className="h-3 w-3" />
            {serviceLabel(dict, id)}
          </span>
        );
      })}
    </div>
  );
}
