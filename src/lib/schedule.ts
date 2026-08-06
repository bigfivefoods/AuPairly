/**
 * Recurring au pair schedule for host families.
 * Client-safe pure helpers (no prisma).
 */

export const WEEKDAYS = [
  { id: "MON", label: "Mon", full: "Monday" },
  { id: "TUE", label: "Tue", full: "Tuesday" },
  { id: "WED", label: "Wed", full: "Wednesday" },
  { id: "THU", label: "Thu", full: "Thursday" },
  { id: "FRI", label: "Fri", full: "Friday" },
  { id: "SAT", label: "Sat", full: "Saturday" },
  { id: "SUN", label: "Sun", full: "Sunday" },
] as const;

export type WeekdayId = (typeof WEEKDAYS)[number]["id"];

export type DayBlock = {
  day: WeekdayId;
  enabled: boolean;
  start: string; // HH:mm
  end: string; // HH:mm
};

export type SchedulePattern = "WEEKLY" | "ALTERNATING" | "FLEXIBLE";

export type RecurringSchedule = {
  /** How the week repeats */
  pattern: SchedulePattern;
  days: DayBlock[];
  /** Optional free-text (e.g. "every second weekend off") */
  notes?: string;
  /** School holiday mode */
  schoolHolidays?: "SAME" | "EXTRA" | "OFF" | "DISCUSS";
};

export function emptySchedule(): RecurringSchedule {
  return {
    pattern: "WEEKLY",
    schoolHolidays: "DISCUSS",
    notes: "",
    days: WEEKDAYS.map((d) => ({
      day: d.id,
      enabled: ["MON", "TUE", "WED", "THU", "FRI"].includes(d.id),
      start: "07:30",
      end: "17:30",
    })),
  };
}

export function parseSchedule(raw?: string | null): RecurringSchedule {
  if (!raw) return emptySchedule();
  try {
    const parsed = JSON.parse(raw) as Partial<RecurringSchedule>;
    const base = emptySchedule();
    const byDay = new Map(
      (parsed.days || []).map((d) => [d.day, d] as const)
    );
    return {
      pattern: parsed.pattern || "WEEKLY",
      notes: parsed.notes || "",
      schoolHolidays: parsed.schoolHolidays || "DISCUSS",
      days: base.days.map((d) => {
        const hit = byDay.get(d.day);
        if (!hit) return d;
        return {
          day: d.day,
          enabled: Boolean(hit.enabled),
          start: hit.start || d.start,
          end: hit.end || d.end,
        };
      }),
    };
  } catch {
    return emptySchedule();
  }
}

/** Minutes between HH:mm times (handles overnight lightly). */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

export function computeWeeklyHours(schedule: RecurringSchedule): number {
  const totalMins = schedule.days
    .filter((d) => d.enabled)
    .reduce((sum, d) => sum + minutesBetween(d.start, d.end), 0);
  // Alternating weeks ≈ half the hours on average
  const factor = schedule.pattern === "ALTERNATING" ? 0.5 : 1;
  return Math.round((totalMins / 60) * factor * 10) / 10;
}

export function formatDayLabel(day: WeekdayId): string {
  return WEEKDAYS.find((d) => d.id === day)?.full || day;
}

export function formatScheduleSummary(schedule: RecurringSchedule): string {
  const active = schedule.days.filter((d) => d.enabled);
  if (active.length === 0) return "No fixed days set";
  const hours = computeWeeklyHours(schedule);
  const dayPart = active
    .map((d) => {
      const short = WEEKDAYS.find((w) => w.id === d.day)?.label || d.day;
      return `${short} ${d.start}–${d.end}`;
    })
    .join(", ");
  const pattern =
    schedule.pattern === "ALTERNATING"
      ? " (alternating weeks)"
      : schedule.pattern === "FLEXIBLE"
        ? " (flexible)"
        : " (weekly)";
  return `${dayPart} · ~${hours}h/wk${pattern}`;
}

export function patternLabel(p: SchedulePattern): string {
  switch (p) {
    case "ALTERNATING":
      return "Alternating weeks";
    case "FLEXIBLE":
      return "Flexible week-to-week";
    default:
      return "Same every week";
  }
}

export function schoolHolidayLabel(
  v?: RecurringSchedule["schoolHolidays"]
): string {
  switch (v) {
    case "SAME":
      return "Same hours in school holidays";
    case "EXTRA":
      return "Extra hours in school holidays";
    case "OFF":
      return "Usually off in school holidays";
    default:
      return "School holidays to discuss";
  }
}

export function serializeSchedule(schedule: RecurringSchedule): string {
  return JSON.stringify({
    pattern: schedule.pattern,
    notes: schedule.notes || "",
    schoolHolidays: schedule.schoolHolidays || "DISCUSS",
    days: schedule.days,
  });
}
