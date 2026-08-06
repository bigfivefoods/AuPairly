import { requireUser } from "@/lib/session";
import { PaystackSellerDashboard } from "@/components/paystack-seller-dashboard";
import { isPaystackConfigured } from "@/lib/paystack";
import { PageHeader } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sell with Paystack" };

/**
 * Seller payments hub — Paystack (South Africa + Apple Pay).
 * Stripe Connect sample remains under /api/connect/* for reference but is not the primary path.
 */
export default async function ConnectPage() {
  const user = await requireUser();
  const configured = isPaystackConfigured();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Marketplace payments"
        title="Sell with Paystack"
        description="Built for South African businesses — cards, EFT, and Apple Pay on Safari/iOS."
      />

      {!configured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Paystack keys missing.</strong> Add{" "}
          <code>PAYSTACK_SECRET_KEY</code> and{" "}
          <code>NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code> to <code>.env</code>. Get
          them at{" "}
          <a
            className="underline"
            href="https://dashboard.paystack.com/#/settings/developers"
            target="_blank"
            rel="noreferrer"
          >
            Paystack Dashboard
          </a>
          .
        </div>
      )}

      <PaystackSellerDashboard userId={user.id} />

      <p className="mt-10 text-center text-xs text-stone-400">
        Membership upgrades:{" "}
        <Link href="/pricing" className="text-teal-700 hover:underline">
          Pricing
        </Link>
        {" · "}
        Webhook: <code>/api/billing/webhook</code>
      </p>
    </div>
  );
}
