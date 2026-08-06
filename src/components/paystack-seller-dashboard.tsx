"use client";

/**
 * Seller dashboard for Paystack storefront (SA + Apple Pay).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, Store, RefreshCw } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  amountCents: number;
  currency: string;
};

export function PaystackSellerDashboard({ userId }: { userId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRands, setPriceRands] = useState("250.00");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/paystack/products?sellerId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load products");
        return;
      }
      setProducts(data.products || []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const amountCents = Math.round(Number(priceRands) * 100);
      const res = await fetch("/api/paystack/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined, amountCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create product");
        return;
      }
      setName("");
      setDescription("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Paystack · South Africa
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-stone-900">
              Sell with cards & Apple Pay
            </h2>
            <p className="mt-2 max-w-xl text-sm text-stone-500">
              List products and share your storefront. Customers pay via Paystack
              (Apple Pay when enabled in your Paystack dashboard preferences).
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Link href={`/store/u/${userId}`} className="btn-primary">
              <Store className="h-4 w-4" /> Open storefront
            </Link>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-700" />
          <h3 className="font-display text-xl font-semibold">Your products</h3>
        </div>

        <form onSubmit={createProduct} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend childcare package"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </div>
          <div>
            <Label htmlFor="price">Price (ZAR)</Label>
            <Input
              id="price"
              type="number"
              min="1"
              step="0.01"
              value={priceRands}
              onChange={(e) => setPriceRands(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create product
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="mt-8 flex justify-center py-8 text-stone-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-stone-100 border-t border-stone-100">
            {products.length === 0 && (
              <li className="py-6 text-center text-sm text-stone-400">No products yet</li>
            )}
            {products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-stone-900">{p.name}</p>
                  {p.description && (
                    <p className="text-sm text-stone-500 line-clamp-1">{p.description}</p>
                  )}
                </div>
                <p className="font-semibold text-stone-800">
                  R{(p.amountCents / 100).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
