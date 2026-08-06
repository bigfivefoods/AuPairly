import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment success" };

export default async function StoreSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { sellerId } = await params;
  const sp = await searchParams;
  const reference = sp.reference || sp.trxref;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <PageHeader
          title="Thanks for your order!"
          description="Your Paystack payment was submitted. You should receive a receipt by email."
        />
        {reference && (
          <p className="mt-2 break-all text-xs text-stone-400">Reference: {reference}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/store/u/${sellerId}`} className="btn-secondary">
            Back to store
          </Link>
          <Link href="/" className="btn-primary">
            Home
          </Link>
        </div>
      </Card>
    </div>
  );
}
