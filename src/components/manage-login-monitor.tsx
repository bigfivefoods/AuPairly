import Link from "next/link";
import {
  formatDuration,
  type LoginMonitoringStats,
} from "@/lib/login-monitor-types";
import { Card } from "@/components/ui";

const REENGAGE_RULES = [
  {
    day: 3,
    title: "Quick check-in",
    body: "It's been a few days. A short login helps you stay visible and catch new interests.",
  },
  {
    day: 7,
    title: "It's been a week",
    body: "Log in to reply to messages and shortlist people before they go elsewhere.",
  },
  {
    day: 14,
    title: "Come back — new matches",
    body: "Two weeks away is a long time in a marketplace. Open Discover to see fresh listings.",
  },
  {
    day: 30,
    title: "We saved your spot",
    body: "It's been a month — new sitters and hosts join every week. Log in to see who's near you.",
  },
] as const;

export function ManageLoginMonitor({ stats }: { stats: LoginMonitoringStats }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Login &amp; session monitoring
          </h2>
          <p className="text-xs text-stone-500">
            Who logged in, how long they stayed, and who to re-engage. Rules send
            email + in-app notices at 3 / 7 / 14 / 30 days idle.
          </p>
        </div>
        <Link
          href="/manage/report"
          className="text-xs font-semibold text-teal-700 hover:underline"
        >
          Include on A4 report →
        </Link>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[
          {
            l: "Logins today",
            v: stats.loginsToday,
            h: `${stats.uniqueLoginsToday} unique`,
          },
          {
            l: "Logins 7d",
            v: stats.loginsWeek,
            h: `${stats.uniqueLoginsWeek} unique`,
          },
          { l: "Logins 30d", v: stats.loginsMonth, h: "Sessions started" },
          {
            l: "Active now",
            v: stats.activeNow,
            h: "Open session · seen ≤15m",
          },
          {
            l: "Avg session (7d)",
            v: formatDuration(stats.avgSessionSecWeek),
            h: `Median ${formatDuration(stats.medianSessionSecWeek)}`,
          },
          {
            l: "Never logged in",
            v: stats.neverLoggedIn,
            h: "Hosts + sitters",
          },
        ].map((k) => (
          <div
            key={k.l}
            className="rounded-2xl border border-stone-200 bg-white px-3 py-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              {k.l}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-stone-900">
              {k.v}
            </p>
            <p className="text-xs text-stone-500">{k.h}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        {[
          { l: "Idle ≥3d", v: stats.inactive3d, day: 3 },
          { l: "Idle ≥7d", v: stats.inactive7d, day: 7 },
          { l: "Idle ≥14d", v: stats.inactive14d, day: 14 },
          { l: "Idle ≥30d", v: stats.inactive30d, day: 30 },
        ].map((k) => (
          <div
            key={k.l}
            className={`rounded-2xl border px-3 py-3 ${
              k.v > 0
                ? "border-amber-200 bg-amber-50/60"
                : "border-stone-200 bg-white"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              {k.l}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-stone-900">
              {k.v}
            </p>
            <p className="text-[11px] text-stone-500">
              Re-engage rule day {k.day}
            </p>
          </div>
        ))}
      </div>

      <Card className="mb-4 !p-4">
        <h3 className="text-sm font-semibold text-stone-900">
          Notification rules (automatic)
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
          {REENGAGE_RULES.slice()
            .reverse()
            .map((r) => (
              <li key={r.day} className="flex gap-2">
                <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 font-semibold text-teal-900">
                  {r.day}d idle
                </span>
                <span>
                  <strong className="text-stone-800">{r.title}</strong> —{" "}
                  {r.body}
                </span>
              </li>
            ))}
        </ul>
        <p className="mt-2 text-[11px] text-stone-400">
          Cron: daily <code className="rounded bg-stone-100 px-1">/api/cron/reengage</code>{" "}
          · respects email prefs OFF · max one step-up every 2 days per member
        </p>
      </Card>

      {/* Management team always visible */}
      <Card className="mb-4 !p-0 overflow-hidden border-teal-200">
        <div className="border-b border-teal-100 bg-teal-50/50 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-teal-950">
            Management team logins
          </h3>
          <p className="text-[11px] text-teal-900/70">
            Craig, Rylee, Nicola, Clint, Bianca, and other allowlisted ops emails.
            Last login uses login record, then session, then last activity on site.
          </p>
        </div>
        <div className="max-h-64 overflow-auto">
          <table className="w-full min-w-[32rem] text-left text-xs">
            <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Last login / seen</th>
                <th className="px-3 py-2 font-semibold">Idle</th>
                <th className="px-3 py-2 font-semibold"># logins</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats.managementUsers || []).map((u) => (
                <tr key={u.email} className="border-t border-stone-50">
                  <td className="px-3 py-2 font-medium text-stone-800">
                    {u.name}
                  </td>
                  <td className="px-3 py-2 text-stone-600">{u.email}</td>
                  <td className="px-3 py-2 text-stone-600">
                    {u.lastLoginAt ? (
                      <>
                        {new Date(u.lastLoginAt).toLocaleString()}
                        {u.lastLoginSource && u.lastLoginSource !== "login" && (
                          <span className="ml-1 text-[10px] text-stone-400">
                            ({u.lastLoginSource})
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-stone-400">
                        {u.registered ? "No activity yet" : "Not registered"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.daysSinceLogin == null ? (
                      <span className="text-stone-400">—</span>
                    ) : (
                      <span
                        className={
                          u.daysSinceLogin >= 7
                            ? "font-semibold text-amber-800"
                            : "text-stone-700"
                        }
                      >
                        {u.daysSinceLogin}d
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold">
                    {u.loginCount}
                  </td>
                  <td className="px-3 py-2">
                    {u.registered ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        On platform
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        Invite pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="!p-0 overflow-hidden">
          <div className="border-b border-stone-100 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-stone-900">
              Recent sessions
            </h3>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Started</th>
                  <th className="px-3 py-2 font-semibold">Duration</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-stone-400">
                      No sessions recorded yet — appear after the next full login
                      (password sign-in).
                    </td>
                  </tr>
                ) : (
                  stats.recentSessions.map((s) => (
                    <tr key={s.id} className="border-t border-stone-50">
                      <td className="px-3 py-2">
                        <p className="font-medium text-stone-800">{s.name}</p>
                        <p className="text-[10px] text-stone-400">
                          {s.role} · {s.email}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-stone-600">
                        {new Date(s.startedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-semibold tabular-nums text-stone-800">
                        {s.durationLabel}
                      </td>
                      <td className="px-3 py-2">
                        {s.open ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Open
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                            Ended
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="border-b border-stone-100 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-stone-900">
              Last login by member
            </h3>
            <p className="text-[11px] text-stone-500">
              Uses login time, or last site activity if login tracking was added later.
            </p>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Last login</th>
                  <th className="px-3 py-2 font-semibold">Idle</th>
                  <th className="px-3 py-2 font-semibold"># logins</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-t border-stone-50 ${
                      u.isManagement ? "bg-teal-50/40" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-stone-800">
                        {u.name}
                        {u.isManagement && (
                          <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-semibold text-teal-900">
                            ops
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {u.role} · {u.email}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-stone-600">
                      {u.lastLoginAt ? (
                        <>
                          {new Date(u.lastLoginAt).toLocaleString()}
                          {u.lastLoginSource &&
                            u.lastLoginSource !== "login" && (
                              <span className="ml-1 text-[10px] text-stone-400">
                                via {u.lastLoginSource}
                              </span>
                            )}
                        </>
                      ) : (
                        <span className="text-stone-400">— never —</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {u.daysSinceLogin == null ? (
                        <span className="text-stone-400">—</span>
                      ) : (
                        <span
                          className={
                            u.daysSinceLogin >= 7
                              ? "font-semibold text-amber-800"
                              : "text-stone-700"
                          }
                        >
                          {u.daysSinceLogin}d
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-semibold text-stone-800">
                      {u.loginCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}
