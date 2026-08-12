"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, Printer, ArrowLeft, FileText } from "lucide-react";
import type { AnalyticsResult } from "@/lib/ops-analytics-types";
import { BRAND } from "@/lib/brand";

function zar(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function MiniSpark({
  values,
  color = "#0d9488",
}: {
  values: number[];
  color?: string;
}) {
  const w = 120;
  const h = 28;
  const max = Math.max(1, ...values);
  const n = Math.max(1, values.length - 1);
  const d = values
    .map((v, i) => {
      const x = (i / n) * w;
      const y = h - (v / max) * (h - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-[7.5rem]" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

function HBar({
  items,
  maxRows = 5,
}: {
  items: { label: string; value: number }[];
  maxRows?: number;
}) {
  const rows = items.slice(0, maxRows);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5 text-[9px] leading-none">
          <span className="w-[4.5rem] shrink-0 truncate text-stone-600">{r.label}</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-stone-100">
            <div
              className="h-full rounded-sm bg-teal-600"
              style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-7 shrink-0 text-right tabular-nums font-semibold text-stone-800">
            {r.value}
          </span>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-[9px] text-stone-400">No data</p>
      )}
    </div>
  );
}

function StackBars({
  items,
  maxRows = 5,
}: {
  items: { label: string; a: number; b: number }[];
  maxRows?: number;
}) {
  const rows = items.slice(0, maxRows);
  const max = Math.max(1, ...rows.map((r) => r.a + r.b));
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5 text-[9px] leading-none">
          <span className="w-[4.5rem] shrink-0 truncate text-stone-600">{r.label}</span>
          <div className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-stone-100">
            <div
              className="h-full bg-teal-600"
              style={{ width: `${(r.a / max) * 100}%` }}
            />
            <div
              className="h-full bg-sky-500"
              style={{ width: `${(r.b / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right tabular-nums text-stone-700">
            {r.a + r.b}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ManageReportA4({
  data,
  preparedBy,
  days,
}: {
  data: AnalyticsResult;
  preparedBy: string;
  days: number;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const downloadPdf = useCallback(() => {
    // Browser "Save as PDF" with landscape A4 — one page via @page CSS
    document.documentElement.classList.add("manage-report-print");
    window.print();
  }, []);

  useEffect(() => {
    const onAfter = () => {
      document.documentElement.classList.remove("manage-report-print");
    };
    window.addEventListener("afterprint", onAfter);
    return () => window.removeEventListener("afterprint", onAfter);
  }, []);

  const fromLabel = new Date(data.range.from).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const toLabel = new Date(data.range.to).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const genLabel = new Date(data.generatedAt).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const funnelTop = data.funnel.filter((f) =>
    ["signup", "publish_listing", "first_message", "shortlist", "payment_success"].includes(
      f.event
    )
  );

  return (
    <div className="manage-report-root mx-auto max-w-[1200px] px-3 py-6 sm:px-6">
      {/* Screen toolbar — hidden when printing */}
      <div className="manage-report-toolbar mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link href="/manage" className="btn-secondary !py-2 !px-3 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Management
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {[7, 14, 30, 60, 90].map((d) => (
            <Link
              key={d}
              href={`/manage/report?days=${d}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                days === d
                  ? "bg-teal-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn-secondary !py-2 !px-3 text-sm" onClick={downloadPdf}>
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" className="btn-primary !py-2 !px-3 text-sm" onClick={downloadPdf}>
            <Download className="h-4 w-4" />
            Download PDF (A4 landscape)
          </button>
        </div>
      </div>

      <p className="manage-report-toolbar mb-3 text-xs text-stone-500 print:hidden">
        <FileText className="mr-1 inline h-3.5 w-3.5" />
        One-page A4 landscape. Use <strong>Download PDF</strong> → choose “Save as PDF” and
        landscape orientation if prompted. Designed to fit a single page.
      </p>

      {/* Screen: scale A4 sheet into viewport; print uses full A4 landscape */}
      <div className="manage-report-preview-wrap mx-auto w-full overflow-x-auto print:overflow-visible">
      <div
        ref={sheetRef}
        className="manage-report-sheet mx-auto bg-white text-stone-900 shadow-lg ring-1 ring-stone-200 print:shadow-none print:ring-0"
        style={{
          width: "297mm",
          height: "210mm",
          boxSizing: "border-box",
          padding: "7mm 8mm 6mm",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* Header */}
        <header className="mb-2 flex shrink-0 items-start justify-between border-b border-teal-700/30 pb-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              {/* Official brand mark — prints with colour */}
              <Image
                src="/logo-nav.png"
                alt="AuPairly"
                width={200}
                height={79}
                priority
                className="h-8 w-auto object-contain object-left sm:h-9"
                style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
              />
              <div className="min-w-0 border-l border-stone-200 pl-2.5">
                <h1 className="text-[14px] font-bold leading-tight tracking-tight text-stone-900 sm:text-[15px]">
                  Management report
                </h1>
                <p className="text-[9px] text-stone-500">
                  Confidential ops snapshot · {fromLabel} – {toLabel} ({days} days)
                </p>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right text-[9px] text-stone-500">
            <p>
              Prepared for ops · <span className="font-medium text-stone-700">{preparedBy}</span>
            </p>
            <p>Generated {genLabel}</p>
            <p className="font-medium text-teal-800">{BRAND.domain}</p>
          </div>
        </header>

        {/* KPI row */}
        <section className="mb-2 grid shrink-0 grid-cols-8 gap-1.5">
          {[
            { l: "Members", v: data.kpis.members, h: `+${data.kpis.membersInRange} new` },
            { l: "Sitters live", v: data.kpis.activeSitters, h: "Active listings" },
            { l: "Hosts live", v: data.kpis.activeHosts, h: "Active listings" },
            { l: "Messages", v: data.kpis.messagesInRange, h: "Period" },
            { l: "Interests", v: data.kpis.interestsInRange, h: "Period" },
            { l: "Payments", v: data.kpis.paymentsInRange, h: "Successful" },
            { l: "Revenue", v: zar(data.kpis.revenueCentsInRange), h: "Period GMV" },
            {
              l: "Queues",
              v:
                data.queues.pendingVerify +
                data.queues.pendingReviews +
                data.queues.openReports,
              h: `V${data.queues.pendingVerify} R${data.queues.pendingReviews} Rp${data.queues.openReports}`,
            },
          ].map((k) => (
            <div
              key={k.l}
              className="rounded-md border border-stone-200 bg-stone-50/80 px-1.5 py-1"
            >
              <p className="text-[8px] font-semibold uppercase tracking-wide text-stone-400">
                {k.l}
              </p>
              <p className="text-[13px] font-bold leading-tight tabular-nums text-stone-900">
                {k.v}
              </p>
              <p className="truncate text-[8px] text-stone-500">{k.h}</p>
            </div>
          ))}
        </section>

        {/* Main grid */}
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
          {/* Trends */}
          <section className="col-span-5 flex flex-col rounded-md border border-stone-200 p-2">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-wide text-teal-800">
                Activity trends
              </h2>
              <div className="flex gap-2 text-[8px] text-stone-500">
                <span className="inline-flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> Signups
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-600" /> Messages
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-600" /> Interests
                </span>
              </div>
            </div>
            <TrendLines data={data} />
            <div className="mt-1.5 flex justify-between gap-2 border-t border-stone-100 pt-1.5">
              <div>
                <p className="text-[8px] text-stone-400">Signups spark</p>
                <MiniSpark values={data.series.signups} color="#0d9488" />
              </div>
              <div>
                <p className="text-[8px] text-stone-400">Messages spark</p>
                <MiniSpark values={data.series.messages} color="#0369a1" />
              </div>
              <div>
                <p className="text-[8px] text-stone-400">Revenue spark</p>
                <MiniSpark values={data.series.revenueCents} color="#15803d" />
              </div>
            </div>
          </section>

          {/* Funnel */}
          <section className="col-span-3 flex flex-col rounded-md border border-stone-200 p-2">
            <h2 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Funnel
            </h2>
            <div className="flex flex-1 flex-col justify-center space-y-1.5">
              {funnelTop.map((f, i) => {
                const max = Math.max(1, ...funnelTop.map((x) => x.count));
                const labels: Record<string, string> = {
                  signup: "Signup",
                  publish_listing: "Publish",
                  first_message: "1st message",
                  shortlist: "Shortlist",
                  payment_success: "Paid",
                };
                return (
                  <div key={f.event}>
                    <div className="mb-0.5 flex justify-between text-[9px]">
                      <span className="font-medium text-stone-700">
                        {i + 1}. {labels[f.event] || f.event}
                      </span>
                      <span className="tabular-nums font-semibold">{f.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-stone-100">
                      <div
                        className="h-full rounded-sm bg-gradient-to-r from-teal-700 to-teal-400"
                        style={{ width: `${Math.max(2, (f.count / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Queues + plans */}
          <section className="col-span-4 grid grid-rows-2 gap-2">
            <div className="rounded-md border border-stone-200 p-2">
              <h2 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                Ops queues
              </h2>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { l: "Verify", v: data.queues.pendingVerify },
                  { l: "Reviews", v: data.queues.pendingReviews },
                  { l: "Reports", v: data.queues.openReports },
                  { l: "Tickets", v: data.queues.openTickets },
                  { l: "Suspend", v: data.queues.suspended },
                ].map((q) => (
                  <div
                    key={q.l}
                    className={`rounded border px-1 py-1 text-center ${
                      q.v > 0
                        ? "border-amber-200 bg-amber-50"
                        : "border-stone-100 bg-stone-50"
                    }`}
                  >
                    <p className="text-[14px] font-bold tabular-nums text-stone-900">{q.v}</p>
                    <p className="text-[8px] font-medium text-stone-500">{q.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-stone-200 p-2">
              <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                Plan mix
              </h2>
              <HBar
                items={data.breakdowns.byPlan.map((p) => ({
                  label: p.key,
                  value: p.count,
                }))}
                maxRows={4}
              />
            </div>
          </section>

          {/* Cities */}
          <section className="col-span-4 rounded-md border border-stone-200 p-2">
            <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Top cities (sitters / hosts)
            </h2>
            <StackBars
              items={data.breakdowns.byCity.map((c) => ({
                label: c.key,
                a: c.sitters,
                b: c.hosts,
              }))}
              maxRows={6}
            />
            <p className="mt-1 text-[8px] text-stone-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-600" /> Sitters{" "}
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-sky-500" /> Hosts
            </p>
          </section>

          {/* Services */}
          <section className="col-span-4 rounded-md border border-stone-200 p-2">
            <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Services
            </h2>
            <StackBars
              items={data.breakdowns.byService.map((s) => ({
                label: s.key.replace(/_/g, " "),
                a: s.sitters,
                b: s.hosts,
              }))}
              maxRows={6}
            />
          </section>

          {/* Role + country */}
          <section className="col-span-4 grid grid-cols-2 gap-2">
            <div className="rounded-md border border-stone-200 p-2">
              <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                By role
              </h2>
              <HBar
                items={data.breakdowns.byRole.map((r) => ({
                  label: r.key,
                  value: r.count,
                }))}
              />
            </div>
            <div className="rounded-md border border-stone-200 p-2">
              <h2 className="mb-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                Countries
              </h2>
              <HBar
                items={data.breakdowns.byCountry.map((r) => ({
                  label: r.key,
                  value: r.count,
                }))}
                maxRows={5}
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-1.5 flex shrink-0 items-center justify-between border-t border-stone-200 pt-1 text-[8px] text-stone-400">
          <span>
            Filters: suspended excluded · all roles/plans · {days}-day window · listing KPIs =
            ACTIVE
          </span>
          <span>
            {BRAND.name} management · page 1 of 1 · A4 landscape
          </span>
        </footer>
      </div>
      </div>
    </div>
  );
}

function TrendLines({ data }: { data: AnalyticsResult }) {
  const w = 420;
  const h = 88;
  const pad = { t: 4, r: 4, b: 14, l: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const series = [
    { values: data.series.signups, color: "#0d9488" },
    { values: data.series.messages, color: "#0369a1" },
    { values: data.series.interests, color: "#7c3aed" },
  ];
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = Math.max(1, data.series.dates.length - 1);

  function path(values: number[]) {
    return values
      .map((v, i) => {
        const x = pad.l + (i / n) * innerW;
        const y = pad.t + innerH - (v / max) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  const tickEvery = Math.max(1, Math.ceil(data.series.dates.length / 4));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full flex-1" role="img">
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + innerH * (1 - t);
        return (
          <g key={t}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y}
              y2={y}
              stroke="#e7e5e4"
              strokeWidth={0.8}
            />
            <text x={pad.l - 3} y={y + 2.5} textAnchor="end" fill="#a8a29e" fontSize={7}>
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {series.map((s) => (
        <path
          key={s.color}
          d={path(s.values)}
          fill="none"
          stroke={s.color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {data.series.dates.map((lab, i) => {
        if (i % tickEvery !== 0 && i !== data.series.dates.length - 1) return null;
        const x = pad.l + (i / n) * innerW;
        return (
          <text
            key={lab + i}
            x={x}
            y={h - 2}
            textAnchor="middle"
            fill="#a8a29e"
            fontSize={6.5}
          >
            {lab.slice(5)}
          </text>
        );
      })}
    </svg>
  );
}
