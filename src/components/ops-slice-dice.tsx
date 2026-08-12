"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import {
  BarChart,
  FunnelChart,
  KpiTile,
  LineChart,
  StackedBarChart,
  formatZar,
} from "@/components/ops-charts";
import { SERVICE_IDS } from "@/lib/services";
import type { AnalyticsResult } from "@/lib/ops-analytics-types";

type FiltersState = {
  days: string;
  role: string;
  plan: string;
  city: string;
  country: string;
  listingStatus: string;
  verified: string;
  service: string;
  suspended: string;
};

const DEFAULT: FiltersState = {
  days: "30",
  role: "ALL",
  plan: "ALL",
  city: "",
  country: "",
  listingStatus: "ALL",
  verified: "ALL",
  service: "ALL",
  suspended: "NO",
};

function toQuery(f: FiltersState) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  return p.toString();
}

const FUNNEL_LABELS: Record<string, string> = {
  signup: "Signup",
  publish_listing: "Publish listing",
  first_message: "First message",
  shortlist: "Shortlist",
  placement_start: "Placement start",
  checkout_start: "Checkout start",
  payment_success: "Payment success",
  invite_copy: "Invite copy",
  house_swap_interest: "House swap interest",
};

export function OpsSliceDice({
  defaultOpen = true,
  compact = false,
  title = "Analytics — slice & dice",
}: {
  defaultOpen?: boolean;
  /** Smaller KPI grid for admin page */
  compact?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT);
  const [applied, setApplied] = useState<FiltersState>(DEFAULT);
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seriesMode, setSeriesMode] = useState<"activity" | "revenue">("activity");

  const load = useCallback(async (f: FiltersState) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?${toQuery(f)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load analytics");
        return;
      }
      setData(json as AnalyticsResult);
      setApplied(f);
    } catch {
      setError("Network error loading analytics");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (open && !data && !busy) void load(DEFAULT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof FiltersState>(k: K, v: FiltersState[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
  }

  function apply() {
    void load(filters);
  }

  function reset() {
    setFilters(DEFAULT);
    void load(DEFAULT);
  }

  const activeChips = useMemo(() => {
    const chips: string[] = [];
    if (applied.days !== "30") chips.push(`${applied.days}d`);
    if (applied.role !== "ALL") chips.push(`role:${applied.role}`);
    if (applied.plan !== "ALL") chips.push(`plan:${applied.plan}`);
    if (applied.city) chips.push(`city:${applied.city}`);
    if (applied.country) chips.push(`country:${applied.country}`);
    if (applied.listingStatus !== "ALL")
      chips.push(`listing:${applied.listingStatus}`);
    if (applied.verified !== "ALL") chips.push(`verified:${applied.verified}`);
    if (applied.service !== "ALL") chips.push(`service:${applied.service}`);
    if (applied.suspended !== "NO") chips.push(`suspended:${applied.suspended}`);
    return chips;
  }, [applied]);

  return (
    <Card className="mb-8 overflow-hidden border-teal-200/80 !p-0 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-teal-50/40 sm:px-5"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-700" />
          <span>
            <span className="block font-display text-base font-semibold text-stone-900 sm:text-lg">
              {title}
            </span>
            <span className="block text-xs text-stone-500">
              Graphs + filters by role, plan, city, service, verification &amp; more
              {activeChips.length > 0
                ? ` · ${activeChips.length} filter(s) active`
                : ""}
            </span>
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-stone-400" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 py-4 sm:px-5">
          {/* Filter panel */}
          <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-50/80">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-stone-800"
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4 text-teal-700" />
                Slice criteria
              </span>
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4 text-stone-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-400" />
              )}
            </button>
            {filtersOpen && (
              <div className="border-t border-stone-200 px-3 pb-3 pt-2">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div>
                    <Label>Date range</Label>
                    <Select
                      value={filters.days}
                      onChange={(e) => set("days", e.target.value)}
                    >
                      <option value="7">Last 7 days</option>
                      <option value="14">Last 14 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="60">Last 60 days</option>
                      <option value="90">Last 90 days</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={filters.role}
                      onChange={(e) => set("role", e.target.value)}
                    >
                      <option value="ALL">All roles</option>
                      <option value="AUPAIR">Sitters (AUPAIR)</option>
                      <option value="PARENT">Hosts (PARENT)</option>
                      <option value="ADMIN">Admin</option>
                      <option value="AGENCY">Agency</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Select
                      value={filters.plan}
                      onChange={(e) => set("plan", e.target.value)}
                    >
                      <option value="ALL">All plans</option>
                      <option value="FREE">Free</option>
                      <option value="PLUS">Plus</option>
                      <option value="PREMIUM">Premium</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Listing status</Label>
                    <Select
                      value={filters.listingStatus}
                      onChange={(e) => set("listingStatus", e.target.value)}
                    >
                      <option value="ALL">All statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="PAUSED">Paused</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Verified listing</Label>
                    <Select
                      value={filters.verified}
                      onChange={(e) => set("verified", e.target.value)}
                    >
                      <option value="ALL">All</option>
                      <option value="YES">Verified only</option>
                      <option value="NO">Unverified only</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Service</Label>
                    <Select
                      value={filters.service}
                      onChange={(e) => set("service", e.target.value)}
                    >
                      <option value="ALL">All services</option>
                      {SERVICE_IDS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>City contains</Label>
                    <Input
                      value={filters.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="e.g. Cape Town"
                    />
                  </div>
                  <div>
                    <Label>Country contains</Label>
                    <Input
                      value={filters.country}
                      onChange={(e) => set("country", e.target.value)}
                      placeholder="e.g. South Africa"
                    />
                  </div>
                  <div>
                    <Label>Suspended</Label>
                    <Select
                      value={filters.suspended}
                      onChange={(e) => set("suspended", e.target.value)}
                    >
                      <option value="NO">Exclude suspended</option>
                      <option value="YES">Suspended only</option>
                      <option value="ALL">Include all</option>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" onClick={apply} disabled={busy}>
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Filter className="h-4 w-4" />
                    )}
                    Apply slice
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={reset}
                    disabled={busy}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => load(applied)}
                    disabled={busy}
                  >
                    <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                {activeChips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeChips.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-900"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          {busy && !data && (
            <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading analytics…
            </div>
          )}

          {data && (
            <>
              <p className="mb-3 text-xs text-stone-400">
                Generated {new Date(data.generatedAt).toLocaleString()} · range{" "}
                {data.range.days} days
                {busy ? " · updating…" : ""}
              </p>

              {/* KPIs */}
              <div
                className={`mb-6 grid gap-2.5 ${
                  compact
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                }`}
              >
                <KpiTile
                  label="Members (slice)"
                  value={data.kpis.members}
                  hint={`${data.kpis.membersInRange} new in range`}
                />
                <KpiTile
                  label="Active sitters"
                  value={data.kpis.activeSitters}
                />
                <KpiTile label="Active hosts" value={data.kpis.activeHosts} />
                <KpiTile
                  label="Messages"
                  value={data.kpis.messagesInRange}
                  hint="In date range"
                />
                <KpiTile
                  label="Interests"
                  value={data.kpis.interestsInRange}
                />
                <KpiTile
                  label="Revenue"
                  value={formatZar(data.kpis.revenueCentsInRange)}
                  hint={`${data.kpis.paymentsInRange} payments`}
                />
                <KpiTile
                  label="Pending verify"
                  value={data.queues.pendingVerify}
                  hot={data.queues.pendingVerify > 0}
                />
                <KpiTile
                  label="Open reports"
                  value={data.queues.openReports}
                  hot={data.queues.openReports > 0}
                />
                <KpiTile
                  label="Review queue"
                  value={data.queues.pendingReviews}
                  hot={data.queues.pendingReviews > 0}
                />
                <KpiTile
                  label="Open tickets"
                  value={data.queues.openTickets}
                  hot={data.queues.openTickets > 0}
                />
                <KpiTile label="Suspended" value={data.queues.suspended} />
              </div>

              {/* Trends */}
              <div className="mb-6 grid gap-4 lg:grid-cols-5">
                <div className="rounded-2xl border border-stone-200 bg-white p-4 lg:col-span-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-stone-900">
                      Trends over time
                    </h3>
                    <div className="flex gap-1 rounded-lg bg-stone-100 p-0.5 text-xs font-semibold">
                      <button
                        type="button"
                        className={`rounded-md px-2.5 py-1 ${
                          seriesMode === "activity"
                            ? "bg-white text-teal-800 shadow-sm"
                            : "text-stone-500"
                        }`}
                        onClick={() => setSeriesMode("activity")}
                      >
                        Activity
                      </button>
                      <button
                        type="button"
                        className={`rounded-md px-2.5 py-1 ${
                          seriesMode === "revenue"
                            ? "bg-white text-teal-800 shadow-sm"
                            : "text-stone-500"
                        }`}
                        onClick={() => setSeriesMode("revenue")}
                      >
                        Revenue
                      </button>
                    </div>
                  </div>
                  {seriesMode === "activity" ? (
                    <LineChart
                      labels={data.series.dates}
                      series={[
                        {
                          name: "Signups",
                          values: data.series.signups,
                          color: "#0d9488",
                        },
                        {
                          name: "Messages",
                          values: data.series.messages,
                          color: "#0369a1",
                        },
                        {
                          name: "Interests",
                          values: data.series.interests,
                          color: "#7c3aed",
                        },
                        {
                          name: "Payments",
                          values: data.series.payments,
                          color: "#c2410c",
                        },
                      ]}
                    />
                  ) : (
                    <LineChart
                      labels={data.series.dates}
                      series={[
                        {
                          name: "Revenue (cents)",
                          values: data.series.revenueCents,
                          color: "#15803d",
                        },
                        {
                          name: "Payment count",
                          values: data.series.payments,
                          color: "#c2410c",
                        },
                      ]}
                    />
                  )}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4 lg:col-span-2">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    Conversion funnel
                  </h3>
                  <FunnelChart
                    steps={data.funnel.map((f) => ({
                      label: FUNNEL_LABELS[f.event] || f.event,
                      count: f.count,
                    }))}
                  />
                </div>
              </div>

              {/* Breakdowns */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    By role
                  </h3>
                  <BarChart
                    items={data.breakdowns.byRole.map((r) => ({
                      label: r.key,
                      value: r.count,
                    }))}
                  />
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    By plan
                  </h3>
                  <BarChart
                    items={data.breakdowns.byPlan.map((r) => ({
                      label: r.key,
                      value: r.count,
                    }))}
                  />
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    By country
                  </h3>
                  <BarChart
                    items={data.breakdowns.byCountry.map((r) => ({
                      label: r.key,
                      value: r.count,
                    }))}
                  />
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    Top cities (sitters / hosts)
                  </h3>
                  <StackedBarChart
                    items={data.breakdowns.byCity.map((c) => ({
                      label: c.key,
                      a: c.sitters,
                      b: c.hosts,
                    }))}
                  />
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    Listing status
                  </h3>
                  <StackedBarChart
                    items={data.breakdowns.byListingStatus.map((s) => ({
                      label: s.key,
                      a: s.sitters,
                      b: s.hosts,
                    }))}
                  />
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-stone-900">
                    By service
                  </h3>
                  <StackedBarChart
                    items={data.breakdowns.byService.map((s) => ({
                      label: s.key.replace(/_/g, " "),
                      a: s.sitters,
                      b: s.hosts,
                    }))}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
