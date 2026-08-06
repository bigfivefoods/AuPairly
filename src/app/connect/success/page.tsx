import { requireUser } from "@/lib/session";
import { SubscriptionSuccess } from "@/components/subscription-success";

export const dynamic = "force-dynamic";
export const metadata = { title: "Thanks for your order!" };

/**
 * Post-subscription success page (Stripe sample "Thanks for your order!").
 * Checkout success_url points here with ?session_id={CHECKOUT_SESSION_ID}.
 */
export default async function ConnectSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; plan?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;

  return (
    <SubscriptionSuccess
      sessionId={sp.session_id}
      planName={sp.plan || "Starter"}
      returnHref="/connect"
    />
  );
}
