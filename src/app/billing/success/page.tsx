import { requireUser } from "@/lib/session";
import { SubscriptionSuccess } from "@/components/subscription-success";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thanks for your order!" };

/**
 * Post-Paystack success page (same UX as Stripe sample "Thanks for your order").
 */
export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; reference?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  return (
    <SubscriptionSuccess
      sessionId={sp.reference}
      planName={sp.plan || "Plus"}
      returnHref="/billing"
      provider="paystack"
    />
  );
}
