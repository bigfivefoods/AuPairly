"use client";

/**
 * Paystack redirects here after checkout:
 *   /billing/callback?reference=...&trxref=...&plan=PLUS
 *
 * We verify the transaction server-side, then send the user to the success page.
 */

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui";

function CallbackInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const reference = sp.get("reference") || sp.get("trxref") || "";
    const plan = sp.get("plan") || "PLUS";

    if (!reference) {
      setError("Missing payment reference from Paystack.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/billing/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, planId: plan }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not verify payment");
          return;
        }
        router.replace(
          `/billing/success?plan=${encodeURIComponent(data.plan || plan)}&reference=${encodeURIComponent(reference)}`
        );
      } catch {
        setError("Network error while verifying payment");
      }
    })();
  }, [sp, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="text-center">
        {error ? (
          <>
            <p className="font-display text-xl font-semibold text-stone-900">
              Payment verification failed
            </p>
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <a href="/pricing" className="btn-primary mt-6 inline-flex">
              Back to pricing
            </a>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
            <p className="mt-4 font-display text-lg font-semibold text-stone-900">
              Confirming your Paystack payment…
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Please wait — do not close this window.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

export default function BillingCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
