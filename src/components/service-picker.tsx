"use client";

import { Baby, Home, PawPrint } from "lucide-react";
import {
  PET_TYPE_OPTIONS,
  SERVICE_LIST,
  type ServiceId,
} from "@/lib/services";
import { cn } from "@/lib/utils";
import { ChipToggle, Input, Label, Textarea } from "@/components/ui";

const ICONS = {
  baby: Baby,
  home: Home,
  paw: PawPrint,
} as const;

export function ServicePicker({
  mode,
  value,
  onChange,
  petTypes = [],
  onPetTypesChange,
  houseNotes = "",
  onHouseNotesChange,
}: {
  mode: "provider" | "host";
  value: ServiceId[];
  onChange: (next: ServiceId[]) => void;
  petTypes?: string[];
  onPetTypesChange?: (next: string[]) => void;
  houseNotes?: string;
  onHouseNotesChange?: (next: string) => void;
}) {
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        {mode === "provider"
          ? "Select every service you offer. You can do one or combine all three."
          : "Select what you need help with. You can hire for one service or a combination."}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
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
              <span className="text-sm font-semibold">
                {mode === "provider" ? s.providerLabel.replace(/^I offer /, "") : s.shortName}
              </span>
              <span className="text-xs opacity-80">{s.tagline}</span>
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
                ? "e.g. Experience with alarms, plants, long stays…"
                : "e.g. Dates away, plants, alarm code process, mail…"
            }
          />
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
            {s.shortName}
          </span>
        );
      })}
    </div>
  );
}
