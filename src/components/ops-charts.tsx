"use client";

import { cn } from "@/lib/utils";

/** Shared chart palette */
const COLORS = [
  "#0d9488", // teal
  "#0369a1", // sky
  "#c2410c", // orange
  "#7c3aed", // violet
  "#be123c", // rose
  "#15803d", // green
  "#a16207", // amber
  "#475569", // slate
];

export function formatZar(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    maximumFractionDigits: 0,
  })}`;
}

/** Multi-series line chart (SVG) */
export function LineChart({
  labels,
  series,
  height = 180,
  className,
}: {
  labels: string[];
  series: { name: string; values: number[]; color?: string }[];
  height?: number;
  className?: string;
}) {
  const w = 640;
  const h = height;
  const pad = { t: 12, r: 12, b: 28, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values),
  );
  const n = Math.max(1, labels.length - 1);

  function pathFor(values: number[]) {
    if (!values.length) return "";
    return values
      .map((v, i) => {
        const x = pad.l + (i / n) * innerW;
        const y = pad.t + innerH - (v / max) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  // Show ~5 x labels
  const tickEvery = Math.max(1, Math.ceil(labels.length / 5));

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={y}
                y2={y}
                stroke="#e7e5e4"
                strokeWidth={1}
              />
              <text
                x={pad.l - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-stone-400"
                style={{ fontSize: 10 }}
              >
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {series.map((s, si) => (
          <path
            key={s.name}
            d={pathFor(s.values)}
            fill="none"
            stroke={s.color || COLORS[si % COLORS.length]}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {labels.map((lab, i) => {
          if (i % tickEvery !== 0 && i !== labels.length - 1) return null;
          const x = pad.l + (i / n) * innerW;
          const short = lab.slice(5); // MM-DD
          return (
            <text
              key={lab + i}
              x={x}
              y={h - 8}
              textAnchor="middle"
              className="fill-stone-400"
              style={{ fontSize: 9 }}
            >
              {short}
            </text>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 px-1">
        {series.map((s, si) => (
          <span
            key={s.name}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: s.color || COLORS[si % COLORS.length] }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar chart */
export function BarChart({
  items,
  height,
  valueLabel,
  className,
}: {
  items: { label: string; value: number; color?: string; sub?: string }[];
  height?: number;
  valueLabel?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = valueLabel || ((v: number) => String(v));

  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-stone-400">No data for this slice</p>
    );
  }

  return (
    <div className={cn("space-y-2", className)} style={height ? { minHeight: height } : undefined}>
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="mb-0.5 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-stone-700">
              {it.label}
              {it.sub ? (
                <span className="ml-1 font-normal text-stone-400">{it.sub}</span>
              ) : null}
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-stone-900">
              {fmt(it.value)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(2, (it.value / max) * 100)}%`,
                background: it.color || COLORS[i % COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stacked two-series bar (sitters / hosts) */
export function StackedBarChart({
  items,
  className,
}: {
  items: { label: string; a: number; b: number; aLabel?: string; bLabel?: string }[];
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.a + i.b));
  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-stone-400">No data for this slice</p>
    );
  }
  return (
    <div className={cn("space-y-2.5", className)}>
      {items.map((it) => (
        <div key={it.label}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="font-medium text-stone-700">{it.label}</span>
            <span className="tabular-nums text-stone-500">
              {it.a}+{it.b} = {it.a + it.b}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-teal-600"
              style={{ width: `${(it.a / max) * 100}%` }}
              title={`${it.aLabel || "A"}: ${it.a}`}
            />
            <div
              className="h-full bg-sky-500"
              style={{ width: `${(it.b / max) * 100}%` }}
              title={`${it.bLabel || "B"}: ${it.b}`}
            />
          </div>
        </div>
      ))}
      <div className="flex gap-3 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-teal-600" /> Sitters
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" /> Hosts
        </span>
      </div>
    </div>
  );
}

/** Funnel step bars */
export function FunnelChart({
  steps,
  className,
}: {
  steps: { label: string; count: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((s, i) => {
        const prev = i === 0 ? s.count : steps[i - 1].count;
        const rate =
          prev > 0 && i > 0 ? Math.round((s.count / prev) * 100) : null;
        return (
          <div key={s.label}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700">
                {i + 1}. {s.label}
              </span>
              <span className="tabular-nums text-stone-600">
                {s.count}
                {rate != null ? (
                  <span className="ml-1 text-stone-400">({rate}% step)</span>
                ) : null}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-md bg-stone-100">
              <div
                className="h-full rounded-md bg-gradient-to-r from-teal-600 to-teal-400"
                style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function KpiTile({
  label,
  value,
  hint,
  hot,
}: {
  label: string;
  value: string | number;
  hint?: string;
  hot?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3 shadow-sm",
        hot
          ? "border-amber-200 bg-amber-50/60"
          : "border-stone-200 bg-white"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-stone-900">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
