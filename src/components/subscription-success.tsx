"use client";

/**
 * "Thanks for your order" success UI.
 * Primary provider: Paystack (SA). Stripe portal kept as optional fallback.
 */

import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui";

export function SubscriptionSuccess({
  sessionId,
  planName = "Starter",
  returnHref = "/billing",
  provider = "paystack",
}: {
  sessionId?: string;
  planName?: string;
  returnHref?: string;
  provider?: "paystack" | "stripe";
}) {
  return (
    <section className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
          <CheckCircle2 className="h-8 w-8 text-teal-600" aria-hidden />
        </div>

        <div className="mt-6 description">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            Thanks for your order!
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Subscription to {planName} plan successful!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Your membership is active
            {provider === "paystack"
              ? " for the next 30 days via Paystack (cards & Apple Pay)."
              : "."}{" "}
            You can upgrade again from Pricing when it renews.
          </p>
        </div>

        {sessionId && (
          <p className="mt-4 break-all text-[11px] text-stone-400">
            Reference: {sessionId}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {provider === "paystack" && (
            <a
              href="https://paystack.com/login"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full justify-center"
            >
              Manage payments on Paystack
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <Link href={returnHref} className="btn-primary w-full justify-center">
            Back to billing
          </Link>
          <Link href="/discover" className="text-sm font-semibold text-teal-700 hover:underline">
            Start Discover matching →
          </Link>
        </div>
      </Card>
    </section>
  );
}
