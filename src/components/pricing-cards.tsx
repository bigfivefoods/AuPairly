"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Crown } from "lucide-react";
import { PLANS, priceFor, type PlanId } from "@/lib/plans";
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
    setLoading(planId);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
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

  const order: PlanId[] = ["FREE", "PLUS", "PREMIUM"];

  return (
    <div>
      <p className="mb-6 text-center text-sm text-stone-500">
        Showing prices for{" "}
        <span className="font-semibold text-stone-800">
          {role === "AUPAIR" ? "sitters / caregivers" : "hosts / families"}
        </span>
        {" · "}
        <span className="text-stone-400">Paystack checkout</span>
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        {order.map((id) => {
          const plan = PLANS[id];
          const price = priceFor(plan, role);
          const current = currentPlan === id;
          return (
            <div
              key={id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-white p-6 shadow-[var(--shadow)]",
                plan.popular
                  ? "border-teal-500 ring-2 ring-teal-500/20"
                  : "border-stone-200"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-2">
                {id === "PREMIUM" && <Crown className="h-5 w-5 text-amber-500" />}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
              </div>
              <p className="mt-1 text-sm text-stone-500">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">
                  {price === 0 ? "Free" : `R${price}`}
                </span>
                {price > 0 && <span className="text-stone-400">/mo</span>}
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
                variant={plan.popular ? "primary" : current ? "secondary" : "secondary"}
                disabled={current || loading === id}
                onClick={() => choose(id)}
              >
                {loading === id && <Loader2 className="h-4 w-4 animate-spin" />}
                {current ? "Current plan" : id === "FREE" ? "Get started free" : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          );
        })}
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
