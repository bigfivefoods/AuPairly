"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  amountCents: number;
  currency: string;
};

export function PaystackStorefront({ sellerId }: { sellerId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerName, setSellerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/paystack/products?sellerId=${encodeURIComponent(sellerId)}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not load store");
          return;
        }
        setProducts(data.products || []);
        setSellerName(data.seller?.name || "Seller");
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  async function buy(product: Product) {
    if (!email.includes("@")) {
      setError("Enter your email below before paying (required by Paystack).");
      return;
    }
    setBuying(product.id);
    setError("");
    try {
      const res = await fetch("/api/paystack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        return;
      }
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
      <p className="mb-4 text-sm text-stone-500">
        Seller: <span className="font-semibold text-stone-800">{sellerName}</span>
      </p>

      <Card className="mb-6">
        <Label htmlFor="email">Your email (for receipt & Apple Pay / card checkout)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="mt-1"
        />
      </Card>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <Card className="text-center">
          <p className="font-display text-xl font-semibold">No products yet</p>
          <p className="mt-2 text-sm text-stone-500">This seller hasn&apos;t listed anything.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <h3 className="font-display text-lg font-semibold text-stone-900">{p.name}</h3>
              {p.description && (
                <p className="mt-2 flex-1 text-sm text-stone-500">{p.description}</p>
              )}
              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-semibold">
                  R{(p.amountCents / 100).toFixed(2)}
                </p>
                <Button onClick={() => buy(p)} disabled={buying === p.id}>
                  {buying === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                  Pay
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
