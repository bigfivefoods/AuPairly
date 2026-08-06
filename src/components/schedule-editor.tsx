"use client";

import {
  WEEKDAYS,
  computeWeeklyHours,
  type RecurringSchedule,
  type SchedulePattern,
  type WeekdayId,
} from "@/lib/schedule";
import { Input, Label, Select } from "@/components/ui";

export function ScheduleEditor({
  value,
  onChange,
  mode = "family",
}: {
  value: RecurringSchedule;
  onChange: (next: RecurringSchedule) => void;
  /** family = need coverage; aupair = free to work */
  mode?: "family" | "aupair";
}) {
  const hours = computeWeeklyHours(value);
  const onLabel = mode === "aupair" ? "Available" : "Working";
  const offLabel = mode === "aupair" ? "Unavailable" : "Off";

  function setPattern(pattern: SchedulePattern) {
    onChange({ ...value, pattern });
  }

  function toggleDay(day: WeekdayId) {
    onChange({
      ...value,
      days: value.days.map((d) =>
        d.day === day ? { ...d, enabled: !d.enabled } : d
      ),
    });
  }

  function setTime(day: WeekdayId, field: "start" | "end", time: string) {
    onChange({
      ...value,
      days: value.days.map((d) =>
        d.day === day ? { ...d, [field]: time } : d
      ),
    });
  }

  function applyPreset(preset: "weekdays" | "full" | "school_runs" | "clear") {
    if (preset === "clear") {
      onChange({
        ...value,
        days: value.days.map((d) => ({ ...d, enabled: false })),
      });
      return;
    }
    if (preset === "weekdays") {
      onChange({
        ...value,
        pattern: "WEEKLY",
        days: value.days.map((d) => ({
          ...d,
          enabled: !["SAT", "SUN"].includes(d.day),
          start: "07:30",
          end: "17:30",
        })),
      });
      return;
    }
    if (preset === "full") {
      onChange({
        ...value,
        pattern: "WEEKLY",
        days: value.days.map((d) => ({
          ...d,
          enabled: true,
          start: d.day === "SAT" || d.day === "SUN" ? "09:00" : "07:30",
          end: d.day === "SAT" || d.day === "SUN" ? "13:00" : "18:00",
        })),
      });
      return;
    }
    // school runs: mornings + afternoons weekdays
    onChange({
      ...value,
      pattern: "WEEKLY",
      days: value.days.map((d) => ({
        ...d,
        enabled: !["SAT", "SUN"].includes(d.day),
        start: "06:45",
        end: "08:30",
      })),
      notes:
        (value.notes || "") +
        (value.notes?.includes("Afternoon")
          ? ""
          : " Afternoon school pickup ~14:00–16:30 also expected."),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Repeat pattern</Label>
        <Select
          value={value.pattern}
          onChange={(e) => setPattern(e.target.value as SchedulePattern)}
        >
          <option value="WEEKLY">Same every week</option>
          <option value="ALTERNATING">Alternating weeks (e.g. every other week)</option>
          <option value="FLEXIBLE">Flexible — rough guide only</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["weekdays", "Mon–Fri full day"],
            ["school_runs", "School runs AM"],
            ["full", "7 days"],
            ["clear", "Clear all"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-teal-300 hover:bg-teal-50"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 border-b border-stone-100 bg-stone-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          <span>Day</span>
          <span>On</span>
          <span>Start</span>
          <span>End</span>
        </div>
        <ul className="divide-y divide-stone-100">
          {value.days.map((d) => {
            const meta = WEEKDAYS.find((w) => w.id === d.day)!;
            return (
              <li
                key={d.day}
                className={`grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2 px-3 py-2 ${
                  d.enabled ? "bg-white" : "bg-stone-50/80 opacity-70"
                }`}
              >
                <span className="w-20 text-sm font-medium text-stone-800">
                  {meta.full}
                </span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={() => toggleDay(d.day)}
                    className="h-4 w-4 rounded border-stone-300 text-teal-600"
                  />
                  {d.enabled ? onLabel : offLabel}
                </label>
                <Input
                  type="time"
                  value={d.start}
                  disabled={!d.enabled}
                  onChange={(e) => setTime(d.day, "start", e.target.value)}
                  className="!py-1.5 text-sm"
                />
                <Input
                  type="time"
                  value={d.end}
                  disabled={!d.enabled}
                  onChange={(e) => setTime(d.day, "end", e.target.value)}
                  className="!py-1.5 text-sm"
                />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
        Estimated hours: <strong>~{hours}h per week</strong>
        {value.pattern === "ALTERNATING" && (
          <span className="text-teal-700"> (averaged for alternating weeks)</span>
        )}
        {value.pattern === "FLEXIBLE" && (
          <span className="text-teal-700"> — treat as a guide, not a contract</span>
        )}
      </div>

      <div>
        <Label>School holidays</Label>
        <Select
          value={value.schoolHolidays || "DISCUSS"}
          onChange={(e) =>
            onChange({
              ...value,
              schoolHolidays: e.target.value as RecurringSchedule["schoolHolidays"],
            })
          }
        >
          <option value="DISCUSS">Discuss later</option>
          <option value="SAME">Same hours in school holidays</option>
          <option value="EXTRA">Extra hours in school holidays</option>
          <option value="OFF">Usually off in school holidays</option>
        </Select>
      </div>

      <div>
        <Label>Schedule notes</Label>
        <Input
          value={value.notes || ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="e.g. One weekend per month optional · public holidays off"
        />
      </div>
    </div>
  );
}
