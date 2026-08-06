import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserPlan } from "@/lib/entitlements";
import { PLANS, priceFor } from "@/lib/plans";
import { Badge, Card, PageHeader } from "@/components/ui";
import { format } from "date-fns";
import { Crown, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const { planId, plan, subscription } = await getUserPlan(user.id);
  const price = priceFor(plan, user.role);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Membership"
        title="Billing & plan"
        description="Manage your AuPairly subscription — freemium limits unlock with Plus or Premium."
      />

      {sp.success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          You&apos;re upgraded{sp.plan ? ` to ${sp.plan}` : ""}! Unlimited matching is active.
        </div>
      )}

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {planId !== "FREE" && <Crown className="h-5 w-5 text-amber-500" />}
              <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
              <Badge variant={planId === "FREE" ? "default" : "success"}>{planId}</Badge>
            </div>
            <p className="mt-1 text-stone-500">{plan.tagline}</p>
            <p className="mt-4 font-display text-3xl font-semibold">
              {price === 0 ? "Free" : `R${price}`}
              {price > 0 && (
                <span className="text-base font-normal text-stone-400">/mo</span>
              )}
            </p>
            {subscription?.currentPeriodEnd && planId !== "FREE" && (
              <p className="mt-2 text-sm text-stone-500">
                Renews / ends {format(subscription.currentPeriodEnd, "MMM d, yyyy")}
                {subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
              </p>
            )}
          </div>
          <Sparkles className="h-8 w-8 text-teal-600" />
        </div>

        <ul className="mt-6 space-y-2 border-t border-stone-100 pt-6 text-sm text-stone-600">
          <li>
            Messages / day:{" "}
            <strong>
              {plan.limits.messagesPerDay < 0 ? "Unlimited" : plan.limits.messagesPerDay}
            </strong>
          </li>
          <li>
            Interests / week:{" "}
            <strong>
              {plan.limits.interestsPerWeek < 0 ? "Unlimited" : plan.limits.interestsPerWeek}
            </strong>
          </li>
          <li>
            Discover swipes / day:{" "}
            <strong>
              {plan.limits.swipesPerDay < 0 ? "Unlimited" : plan.limits.swipesPerDay}
            </strong>
          </li>
          <li>
            See who liked you:{" "}
            <strong>{plan.limits.canSeeWhoLikedYou ? "Yes" : "No — upgrade"}</strong>
          </li>
          <li>
            Featured listing:{" "}
            <strong>{plan.limits.featuredListing ? "Yes" : "No"}</strong>
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/pricing" className="btn-primary">
            {planId === "FREE" ? "Upgrade plan" : "Change plan"}
          </Link>
          <Link href="/discover" className="btn-secondary">
            Open Discover
          </Link>
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-stone-400">
        Paystack activates when <code>PAYSTACK_SECRET_KEY</code> is set. Otherwise upgrades run
        in demo mode (30 days). Apple Pay: enable in Paystack Dashboard → Preferences.
      </p>
    </div>
  );
}
