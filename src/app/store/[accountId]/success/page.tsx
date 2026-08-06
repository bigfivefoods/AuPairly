import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment success" };

export default async function StoreSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { accountId } = await params;
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <PageHeader
          title="Payment successful"
          description="Thanks for your purchase. The connected account received a direct charge; the platform took an application fee."
        />
        {sp.session_id && (
          <p className="mt-2 break-all text-xs text-stone-400">
            Session: {sp.session_id}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/store/${accountId}`} className="btn-secondary">
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
