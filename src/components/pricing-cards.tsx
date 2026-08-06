"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Crown } from "lucide-react";
import {
  PLANS,
  TIER_ORDER,
  BILLING_PERIODS,
  PERIOD_LABELS,
  getPeriodPricing,
  type PlanId,
  type BillingPeriod,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export function PricingCards({
  role,
  currentPlan,
  isLoggedIn,
}: {
  role: "PARENT" | "AUPAIR";
  currentPlan: PlanId;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [period, setPeriod] = useState<BillingPeriod>("QUARTER");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function choose(planId: PlanId) {
    if (planId === "FREE") {
      router.push(isLoggedIn ? "/dashboard" : "/register");
      return;
    }
    if (!isLoggedIn) {
      router.push(`/register?next=/pricing`);
      return;
    }
    const key = `${planId}:${period}`;
    setLoading(key);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        return;
      }
      if (data.url) {
        if (data.demo) {
          setMsg(data.message || "Demo upgrade applied!");
          router.push(data.url);
          router.refresh();
        } else {
          window.location.href = data.url;
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <p className="mb-4 text-center text-sm text-stone-500">
        Showing prices for{" "}
        <span className="font-semibold text-stone-800">
          {role === "AUPAIR" ? "sitters / caregivers" : "hosts / families"}
        </span>
        {" · "}
        <span className="text-stone-400">Paystack · ZAR</span>
      </p>

      {/* Period selector — applies to Plus & Premium */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Billing period
        </p>
        <div
          className="inline-flex flex-wrap justify-center rounded-2xl border border-stone-200 bg-stone-50 p-1 shadow-sm"
          role="tablist"
          aria-label="Billing period"
        >
          {BILLING_PERIODS.map((p) => {
            const active = period === p;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-white text-teal-900 shadow-sm ring-1 ring-teal-200"
                    : "text-stone-600 hover:text-stone-900"
                )}
              >
                {PERIOD_LABELS[p].label}
                {p === "QUARTER" && (
                  <span className="ml-1.5 hidden text-[10px] font-bold uppercase text-teal-600 sm:inline">
                    min
                  </span>
                )}
                {p === "ANNUAL" && (
                  <span className="ml-1.5 hidden text-[10px] font-bold uppercase text-amber-600 sm:inline">
                    save
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="max-w-md text-center text-xs text-stone-500">
          {period === "WEEK" && "Once-off week access — great for a hiring sprint."}
          {period === "QUARTER" &&
            "Monthly rate · you must buy 3 months (billed once for the period)."}
          {period === "ANNUAL" && "Full year discounted — best value per month."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIER_ORDER.map((id) => {
          const plan = PLANS[id];
          const pp = id === "FREE" ? null : getPeriodPricing(id, period);
          const display = pp?.displayPrice ?? 0;
          const charge = pp?.priceZar ?? 0;
          const current = currentPlan === id;
          const loadKey = `${id}:${period}`;

          return (
            <div
              key={id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-white p-6 shadow-[var(--shadow)]",
                plan.popular
                  ? "border-teal-500 ring-2 ring-teal-500/20"
                  : plan.bestValue
                    ? "border-amber-400 ring-2 ring-amber-400/20"
                    : "border-stone-200"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              {plan.bestValue && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white">
                  Max visibility
                </span>
              )}

              <div className="flex items-center gap-2">
                {id === "PREMIUM" && <Crown className="h-5 w-5 text-amber-500" />}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
              </div>
              <p className="mt-1 text-sm text-stone-500">{plan.tagline}</p>

              <div className="mt-5 min-h-[5.5rem]">
                {id === "FREE" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-semibold">Free</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-semibold">
                        R{display}
                      </span>
                      {pp?.priceSuffix && (
                        <span className="text-stone-400">{pp.priceSuffix}</span>
                      )}
                    </div>
                    {pp?.compareAtZar != null && (
                      <p className="mt-1 text-sm text-stone-400 line-through">
                        R{pp.compareAtZar.toLocaleString("en-ZA")}
                      </p>
                    )}
                    {pp?.billingNote && (
                      <p className="mt-1 text-xs font-medium text-stone-600">
                        {pp.billingNote}
                      </p>
                    )}
                    {period === "QUARTER" && charge !== display && (
                      <p className="mt-1 text-xs text-teal-800">
                        You pay R{charge} today for 3 months
                      </p>
                    )}
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                      {PERIOD_LABELS[period].label} · {pp?.durationDays} days access
                    </p>
                  </>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-stone-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={
                  plan.popular || plan.bestValue
                    ? "primary"
                    : current
                      ? "secondary"
                      : "secondary"
                }
                disabled={current || loading === loadKey}
                onClick={() => choose(id)}
              >
                {loading === loadKey && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {current
                  ? "Current plan"
                  : id === "FREE"
                    ? "Get started free"
                    : `Get ${plan.name} · ${PERIOD_LABELS[period].shortLabel}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Compact matrix for all periods */}
      <div className="mt-12 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Free</th>
              <th className="px-4 py-3 font-semibold text-teal-800">Plus</th>
              <th className="px-4 py-3 font-semibold text-amber-800">Premium</th>
            </tr>
          </thead>
          <tbody>
            {BILLING_PERIODS.map((p) => {
              const plus = getPeriodPricing("PLUS", p)!;
              const prem = getPeriodPricing("PREMIUM", p)!;
              return (
                <tr
                  key={p}
                  className={cn(
                    "border-b border-stone-50",
                    p === period && "bg-teal-50/40"
                  )}
                >
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {PERIOD_LABELS[p].label}
                    <button
                      type="button"
                      onClick={() => setPeriod(p)}
                      className="ml-2 text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Select
                    </button>
                  </td>
                  <td className="px-4 py-3 text-stone-500">Free forever</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-stone-900">
                      R{plus.displayPrice}
                      {plus.priceSuffix ? ` ${plus.priceSuffix}` : ""}
                    </span>
                    {p === "QUARTER" && (
                      <span className="mt-0.5 block text-xs text-stone-500">
                        R{plus.priceZar} total
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-stone-900">
                      R{prem.displayPrice}
                      {prem.priceSuffix ? ` ${prem.priceSuffix}` : ""}
                    </span>
                    {p === "QUARTER" && (
                      <span className="mt-0.5 block text-xs text-stone-500">
                        R{prem.priceZar} total
                      </span>
                    )}
                    {prem.compareAtZar != null && p === "ANNUAL" && (
                      <span className="mt-0.5 block text-xs text-stone-400 line-through">
                        R{prem.compareAtZar.toLocaleString("en-ZA")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}
      {msg && (
        <p className="mt-4 text-center text-sm text-emerald-700">{msg}</p>
      )}
    </div>
  );
}
