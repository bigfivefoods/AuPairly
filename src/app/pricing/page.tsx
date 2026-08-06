import Link from "next/link";
import { auth } from "@/lib/auth";
import { type PlanId } from "@/lib/plans";
import { PageHeader } from "@/components/ui";
import { PricingCards } from "@/components/pricing-cards";
import { Check, Sparkles, Zap } from "lucide-react";

export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const session = await auth();
  const role = session?.user?.role === "AUPAIR" ? "AUPAIR" : "PARENT";

  // Get plan from DB if logged in
  let planId: PlanId = "FREE";
  if (session?.user?.id) {
    const { getUserPlan } = await import("@/lib/entitlements");
    const p = await getUserPlan(session.user.id);
    planId = p.planId as PlanId;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-800">
          <Sparkles className="h-4 w-4" />
          Trusted care for your family, home &amp; pets
        </div>
        <PageHeader
          title="Plans that grow with your match"
          description="Start free for childcare, caregiving, house sitting, and pet sitting. Upgrade when you're ready for unlimited messages, Discover, and featured visibility."
        />
      </div>

      <PricingCards
        role={role}
        currentPlan={planId as PlanId}
        isLoggedIn={Boolean(session?.user)}
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: <Zap className="h-5 w-5" />,
            title: "Discover & match",
            body: "Swipe through curated cards. Mutual likes = instant match + chat.",
          },
          {
            icon: <Check className="h-5 w-5" />,
            title: "Built on trust",
            body: "Verified profiles, reviews, and structured interests before you commit.",
          },
          {
            icon: <Sparkles className="h-5 w-5" />,
            title: "Pay for outcomes",
            body: "Free to browse. Plus unlocks unlimited outreach when you're serious.",
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
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-stone-400">
        Payments via <strong>Paystack</strong> (South Africa) — cards &amp; Apple Pay.
        Without Paystack keys, upgrades run in <strong>demo mode</strong> (30 days).{" "}
        <Link href="/billing" className="text-teal-700 font-medium hover:underline">
          Manage billing
        </Link>
      </p>
    </div>
  );
}
