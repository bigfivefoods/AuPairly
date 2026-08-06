import { PageHeader } from "@/components/ui";
import { PaystackStorefront } from "@/components/paystack-storefront";
import { isPaystackConfigured } from "@/lib/paystack";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store" };

/**
 * Public seller storefront.
 * Uses app user id (not Stripe acct_). Prefer a public slug later.
 */
export default async function SellerStorePage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const configured = isPaystackConfigured();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Paystack storefront"
        title="Shop this seller"
        description="Secure checkout with cards and Apple Pay (Safari / iOS)."
      />
      {!configured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Paystack keys are not configured on this server yet.
        </div>
      )}
      <PaystackStorefront sellerId={sellerId} />
    </div>
  );
}
