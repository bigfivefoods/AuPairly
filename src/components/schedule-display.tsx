import {
  WEEKDAYS,
  computeWeeklyHours,
  formatScheduleSummary,
  parseSchedule,
  patternLabel,
  schoolHolidayLabel,
} from "@/lib/schedule";

export function ScheduleDisplay({
  scheduleJson,
  weeklyHoursFallback,
}: {
  scheduleJson?: string | null;
  weeklyHoursFallback?: number | null;
}) {
  const schedule = parseSchedule(scheduleJson);
  const hasAny = schedule.days.some((d) => d.enabled);
  const hours = hasAny
    ? computeWeeklyHours(schedule)
    : weeklyHoursFallback ?? null;

  if (!hasAny && hours == null) {
    return (
      <p className="text-sm text-stone-500">No recurring schedule published yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {hasAny && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {patternLabel(schedule.pattern)}
          </p>
          <ul className="space-y-1.5">
            {schedule.days
              .filter((d) => d.enabled)
              .map((d) => {
                const meta = WEEKDAYS.find((w) => w.id === d.day)!;
                return (
                  <li
                    key={d.day}
                    className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-stone-800">{meta.full}</span>
                    <span className="tabular-nums text-stone-600">
                      {d.start} – {d.end}
                    </span>
                  </li>
                );
              })}
          </ul>
        </>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        {hours != null && (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 font-semibold text-teal-800">
            ~{hours}h / week
          </span>
        )}
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">
          {schoolHolidayLabel(schedule.schoolHolidays)}
        </span>
      </div>
      {schedule.notes && (
        <p className="text-sm text-stone-600">{schedule.notes}</p>
      )}
      {!hasAny && weeklyHoursFallback != null && (
        <p className="text-sm text-stone-500">
          About {weeklyHoursFallback}h per week (no day-by-day breakdown).
        </p>
      )}
      {hasAny && (
        <p className="text-[11px] text-stone-400">{formatScheduleSummary(schedule)}</p>
      )}
    </div>
  );
}
