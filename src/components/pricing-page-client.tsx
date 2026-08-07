"use client";

import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { PricingCards } from "@/components/pricing-cards";
import { useI18n } from "@/components/i18n-provider";
import type { PlanId } from "@/lib/plans";

export function PricingPageClient({
  role,
  currentPlan,
  isLoggedIn,
}: {
  role: "PARENT" | "AUPAIR";
  currentPlan: PlanId;
  isLoggedIn: boolean;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8" data-locale={locale}>
      <div className="mb-10 text-center sm:mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800">
          <Sparkles className="h-4 w-4" />
          {t("pricing_badge")}
        </div>
        <h1 className="mx-auto max-w-3xl text-balance font-display text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
          {t("pricing_title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-center text-sm leading-relaxed text-stone-500 sm:text-base">
          {t("pricing_desc")}
        </p>
      </div>

      <PricingCards role={role} currentPlan={currentPlan} isLoggedIn={isLoggedIn} />

      <div className="mt-12 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Feature</th>
              <th className="px-4 py-3 font-semibold">Free</th>
              <th className="px-4 py-3 font-semibold">Plus</th>
              <th className="px-4 py-3 font-semibold">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {[
              ["Marketplace browse", "Yes", "Yes", "Yes"],
              ["AuPair Connect (sitter friends)", "Yes", "Yes", "Yes"],
              ["Messages / day (host matching)", "5", "Higher", "Unlimited"],
              ["Interests / week", "3", "Higher", "Unlimited"],
              ["Discover swipes / day", "20", "Higher", "Unlimited"],
              ["Profile boosts", "—", "Included", "More / month"],
              ["See who liked you", "—", "Yes", "Yes"],
              ["Featured listing", "—", "Yes", "Yes"],
              ["Safety / abuse support tickets", "Free", "Free", "Free"],
              ["Priority product support", "—", "Yes", "Yes"],
            ].map(([feature, free, plus, prem]) => (
              <tr key={feature}>
                <td className="px-4 py-2.5 font-medium text-stone-900">{feature}</td>
                <td className="px-4 py-2.5">{free}</td>
                <td className="px-4 py-2.5">{plus}</td>
                <td className="px-4 py-2.5">{prem}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-stone-100 px-4 py-3 text-xs text-stone-500">
          Peer sitters chat (AuPair Connect) stays generous so community isn&apos;t paywalled.
          Marketplace host↔sitter messaging is the main Free cap. Prices in ZAR via Paystack.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: <Zap className="h-5 w-5" />,
            title: t("pricing_discover_title"),
            body: t("pricing_discover_body"),
          },
          {
            icon: <Check className="h-5 w-5" />,
            title: t("pricing_trust_title"),
            body: t("pricing_trust_body"),
          },
          {
            icon: <Sparkles className="h-5 w-5" />,
            title: t("pricing_tier_period_title"),
            body: t("pricing_tier_period_body"),
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              {f.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-teal-100 bg-teal-50/50 px-6 py-5 text-center text-sm text-stone-600">
        <p className="font-semibold text-teal-900">{t("pricing_payments")}</p>
        <p className="mt-1 text-stone-500">{t("pricing_payments_body")}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/billing" className="font-semibold text-teal-700 hover:underline">
            {t("pricing_manage")}
          </Link>
          <Link href="/refunds" className="font-semibold text-teal-700 hover:underline">
            Refund policy
          </Link>
        </div>
      </div>
    </div>
  );
}
