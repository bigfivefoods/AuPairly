import { StorefrontClient } from "@/components/storefront-client";
import { PageHeader } from "@/components/ui";
import { isStripeConfigured } from "@/lib/stripe-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store" };

/**
 * Public storefront for one connected account.
 *
 * IMPORTANT: This route uses the Stripe account id in the path for the demo.
 * In production, use a slug or public seller id and look up `stripeConnectAccountId`
 * from your database so you never expose raw `acct_...` ids.
 */
export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { accountId } = await params;
  const sp = await searchParams;
  const configured = isStripeConfigured();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Seller storefront"
        title="Shop this seller"
        description={`Connected account: ${accountId}`}
      />

      {!configured && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Stripe is not configured on this server (missing STRIPE_SECRET_KEY).
        </div>
      )}

      {sp.canceled && (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          Checkout canceled — you were not charged.
        </div>
      )}

      <StorefrontClient accountId={accountId} />
    </div>
  );
}
