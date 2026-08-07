import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { type PlanId } from "@/lib/plans";
import { PricingPageClient } from "@/components/pricing-page-client";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free, Plus & Premium plans",
  description:
    "AuPairly pricing for hosts and sitters. Free to join; Plus and Premium unlock more messages, boosts, and free VerifyNow identity checks. Transparent ZAR plans.",
  path: "/pricing",
  keywords: ["au pair pricing", "childcare platform cost", "AuPairly plans"],
});

export default async function PricingPage() {
  const session = await auth();
  const role = session?.user?.role === "AUPAIR" ? "AUPAIR" : "PARENT";

  let planId: PlanId = "FREE";
  if (session?.user?.id) {
    const { getUserPlan } = await import("@/lib/entitlements");
    const p = await getUserPlan(session.user.id);
    planId = p.planId as PlanId;
  }

  return (
    <PricingPageClient
      role={role}
      currentPlan={planId}
      isLoggedIn={Boolean(session?.user)}
    />
  );
}
