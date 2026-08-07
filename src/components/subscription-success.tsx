"use client";

/**
 * Post-membership success UI (Paystack primary).
 */

import Link from "next/link";
import { CheckCircle2, Compass, MessageCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";

export function SubscriptionSuccess({
  sessionId,
  planName = "Plus",
  periodLabel,
  durationDays,
  returnHref = "/billing",
  provider = "paystack",
}: {
  sessionId?: string;
  planName?: string;
  periodLabel?: string;
  durationDays?: number;
  returnHref?: string;
  provider?: "paystack" | "stripe";
}) {
  const days =
    durationDays && durationDays > 0
      ? durationDays
      : periodLabel?.toLowerCase().includes("2 week")
        ? 14
        : periodLabel?.toLowerCase().includes("year") ||
            periodLabel?.toLowerCase().includes("annual")
          ? 365
          : 90;

  return (
    <section className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
          <CheckCircle2 className="h-8 w-8 text-teal-600" aria-hidden />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Payment successful
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            You&apos;re on {planName}
            {periodLabel ? ` · ${periodLabel}` : ""}!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Your membership is active for about <strong>{days} days</strong>
            {provider === "paystack"
              ? " (paid via Paystack — cards & Apple Pay on Safari)."
              : "."}{" "}
            A receipt was sent to your email when delivery is configured.
          </p>
        </div>

        <ul className="mt-6 space-y-2 text-left text-sm text-stone-600">
          <li className="flex gap-2 rounded-xl bg-stone-50 px-3 py-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            Unlimited messages, interests &amp; Discover swipes
          </li>
          <li className="flex gap-2 rounded-xl bg-stone-50 px-3 py-2">
            <Compass className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            See who liked you · featured listing badge
          </li>
          <li className="flex gap-2 rounded-xl bg-stone-50 px-3 py-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            Read receipts on conversations
          </li>
        </ul>

        {sessionId && (
          <p className="mt-4 break-all text-[11px] text-stone-400">
            Reference: {sessionId}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/discover" className="btn-primary w-full justify-center">
            Start Discover matching
          </Link>
          <Link href="/messages" className="btn-secondary w-full justify-center">
            Open messages
          </Link>
          <Link
            href={returnHref}
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            View billing →
          </Link>
        </div>
      </Card>
    </section>
  );
}
