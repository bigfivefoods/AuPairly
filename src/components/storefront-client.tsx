"use client";

/**
 * Public storefront for a connected account.
 *
 * NOTE: This demo puts the raw Stripe account id (acct_...) in the URL.
 * In production, map a friendly slug → account id in your database instead.
 */

import { useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button, Card } from "@/components/ui";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  unitAmount?: number | null;
  currency?: string | null;
  defaultPriceId?: string | null;
};

export function StorefrontClient({ accountId }: { accountId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/connect/products?accountId=${encodeURIComponent(accountId)}`
        );
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Could not load products");
          return;
        }
        if (!cancelled) setProducts(data.products || []);
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  async function buy(product: Product) {
    setBuying(product.id);
    setError("");
    try {
      const res = await fetch("/api/connect/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          productId: product.id,
          priceId: product.defaultPriceId,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        return;
      }
      // Hosted Checkout (direct charge on connected account)
      window.location.href = data.url;
    } finally {
      setBuying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-stone-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading store…
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-xl font-semibold text-stone-800">
            No products yet
          </p>
          <p className="mt-2 text-sm text-stone-500">
            This seller hasn&apos;t listed anything. Check back soon.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <h3 className="font-display text-lg font-semibold text-stone-900">
                {p.name}
              </h3>
              {p.description && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">
                  {p.description}
                </p>
              )}
              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-semibold">
                  {p.unitAmount != null
                    ? `$${(p.unitAmount / 100).toFixed(2)}`
                    : "—"}
                </p>
                <Button
                  onClick={() => buy(p)}
                  disabled={buying === p.id || !p.defaultPriceId}
                >
                  {buying === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                  Buy
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
