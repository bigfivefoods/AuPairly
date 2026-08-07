import { requireUser } from "@/lib/session";
import { SubscriptionSuccess } from "@/components/subscription-success";
import { PERIOD_LABELS, isBillingPeriod, planFor, durationDaysFor } from "@/lib/plans";
import type { BillingPeriod, PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment successful" };

/**
 * Post-Paystack success page.
 */
export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string;
    period?: string;
    reference?: string;
  }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const planId = (sp.plan || "PLUS").toUpperCase() as PlanId;
  const plan = planFor(planId);
  const period: BillingPeriod = isBillingPeriod(sp.period || null)
    ? (sp.period as BillingPeriod)
    : "QUARTER";
  const periodLabel = PERIOD_LABELS[period]?.label;
  const days = durationDaysFor(planId, period);

  return (
    <SubscriptionSuccess
      sessionId={sp.reference}
      planName={plan.name}
      periodLabel={periodLabel}
      durationDays={days}
      returnHref="/billing"
      provider="paystack"
    />
  );
}
