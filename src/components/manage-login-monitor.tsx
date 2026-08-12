"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
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

function sourceLabel(s?: string) {
  if (s === "login") return "password login";
  if (s === "session") return "session";
  if (s === "activity") return "site activity";
  return "";
}

export function ManageLoginMonitor({
  initial,
}: {
  initial: LoginMonitoringStats;
}) {
  const [stats, setStats] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(true);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login-stats", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Refresh failed");
        return;
      }
      setStats(data as LoginMonitoringStats);
    } catch {
      setError("Network error refreshing stats");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      void refresh();
    }, 30_000);
    return () => clearInterval(t);
  }, [auto, refresh]);

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-stone-900">
            Login &amp; session monitoring
          </h2>
          <p className="text-xs text-stone-500">
            Live presence (tab open → heartbeat every ~55s). Sessions close after
            2h idle. Re-engage emails at 3 / 7 / 14 / 30 days since last seen.
          </p>
          <p className="mt-0.5 text-[11px] text-stone-400">
            Snapshot:{" "}
            {stats.generatedAt
              ? new Date(stats.generatedAt).toLocaleString()
              : "—"}
            {auto ? " · auto-refresh 30s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-stone-300 text-teal-600"
            />
            Live refresh
          </label>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={busy}
            className="btn-secondary !py-1.5 !px-3 text-xs"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh now
          </button>
          <Link
            href="/manage/report"
            className="text-xs font-semibold text-teal-700 hover:underline"
          >
            A4 report →
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[
          {
            l: "Sessions today",
            v: stats.loginsToday,
            h: `${stats.uniqueLoginsToday} unique people`,
          },
          {
            l: "Sessions 7d",
            v: stats.loginsWeek,
            h: `${stats.uniqueLoginsWeek} unique`,
          },
          { l: "Sessions 30d", v: stats.loginsMonth, h: "Started in period" },
          {
            l: "Active now",
            v: stats.activeNow,
            h: "Heartbeat ≤3 min",
          },
          {
            l: "Avg session (7d)",
            v: formatDuration(stats.avgSessionSecWeek),
            h: `Median ${formatDuration(stats.medianSessionSecWeek)}`,
          },
          {
            l: "No presence ever",
            v: stats.neverLoggedIn,
            h: "No login / activity",
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
              Re-engage day {k.day} (since last seen)
            </p>
          </div>
        ))}
      </div>

      <Card className="mb-4 !p-4">
        <h3 className="text-sm font-semibold text-stone-900">
          How accuracy works
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-stone-600">
          <li>
            <strong>Password login</strong> starts a session and increments login
            count.
          </li>
          <li>
            <strong>Live heartbeat</strong> every ~55s while an app tab is open
            (updates last seen + duration).
          </li>
          <li>
            <strong>Active now</strong> = open session with heartbeat in the last
            3 minutes.
          </li>
          <li>
            <strong>Last seen</strong> uses the newest of: login time, session
            activity, or other site activity (messages, etc.).
          </li>
          <li>
            Sessions with no heartbeat for <strong>2 hours</strong> auto-close.
          </li>
        </ul>
        <h3 className="mt-3 text-sm font-semibold text-stone-900">
          Re-engage rules
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs text-stone-600">
          {REENGAGE_RULES.map((r) => (
            <li key={r.day} className="flex gap-2">
              <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 font-semibold text-teal-900">
                {r.day}d idle
              </span>
              <span>
                <strong className="text-stone-800">{r.title}</strong> — {r.body}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Management team */}
      <Card className="mb-4 !p-0 overflow-hidden border-teal-200">
        <div className="border-b border-teal-100 bg-teal-50/50 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-teal-950">
            Management team (live)
          </h3>
          <p className="text-[11px] text-teal-900/70">
            Always includes allowlisted ops: Craig, Rylee, Nicola, Clint, Bianca,
            etc.
          </p>
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full min-w-[36rem] text-left text-xs">
            <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Last seen</th>
                <th className="px-3 py-2 font-semibold">Online</th>
                <th className="px-3 py-2 font-semibold">Session now</th>
                <th className="px-3 py-2 font-semibold"># logins</th>
                <th className="px-3 py-2 font-semibold">Account</th>
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
                        {u.lastLoginSource &&
                          u.lastLoginSource !== "login" && (
                            <span className="ml-1 text-[10px] text-stone-400">
                              ({sourceLabel(u.lastLoginSource)})
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
                    {u.isOnline ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                        Online
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold">
                    {u.openSessionDurationSec != null
                      ? formatDuration(u.openSessionDurationSec)
                      : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold">
                    {u.loginCount}
                  </td>
                  <td className="px-3 py-2">
                    {u.registered ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Registered
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
              Recent sessions (by last seen)
            </h3>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Started</th>
                  <th className="px-3 py-2 font-semibold">Last seen</th>
                  <th className="px-3 py-2 font-semibold">Duration</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-stone-400"
                    >
                      No sessions yet. Open any logged-in page to start a live
                      heartbeat, or password sign-in once.
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
                      <td className="px-3 py-2 text-stone-600">
                        {new Date(s.lastSeenAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-semibold tabular-nums text-stone-800">
                        {s.durationLabel}
                      </td>
                      <td className="px-3 py-2">
                        {s.isOnline ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Online
                          </span>
                        ) : s.open ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            Open (idle)
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
              Last seen by member
            </h3>
            <p className="text-[11px] text-stone-500">
              Newest of password login, session heartbeat, or other site
              activity.
            </p>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[28rem] text-left text-xs">
              <thead className="sticky top-0 bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Last seen</th>
                  <th className="px-3 py-2 font-semibold">Idle</th>
                  <th className="px-3 py-2 font-semibold"># logins</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u) => (
                  <tr
                    key={u.id || u.email}
                    className={`border-t border-stone-50 ${
                      u.isManagement ? "bg-teal-50/40" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-stone-800">
                        {u.name}
                        {u.isOnline && (
                          <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-900">
                            online
                          </span>
                        )}
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
                                ({sourceLabel(u.lastLoginSource)})
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
