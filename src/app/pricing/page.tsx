import { auth } from "@/lib/auth";
import { type PlanId } from "@/lib/plans";
import { PricingPageClient } from "@/components/pricing-page-client";

export const metadata = { title: "Pricing" };

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
