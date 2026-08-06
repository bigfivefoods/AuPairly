"use client";

/**
 * Seller dashboard UI for Stripe Connect sample:
 * 1) Create connected account
 * 2) Onboard (Account Links)
 * 3) Live status from Accounts API
 * 4) Create products on connected account
 * 5) Platform subscription + billing portal
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
  Store,
  CreditCard,
} from "lucide-react";
import { Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";

type AccountState = {
  hasAccount: boolean;
  accountId?: string | null;
  readyToProcessPayments?: boolean;
  onboardingComplete?: boolean;
  cardPaymentsStatus?: string;
  requirementsStatus?: string | null;
  displayName?: string;
  contactEmail?: string;
  storefrontPath?: string;
  connectSubscriptionStatus?: string | null;
  message?: string;
  error?: string;
  code?: string;
};

type ProductRow = {
  id: string;
  name: string;
  description?: string | null;
  unitAmount?: number | null;
  currency?: string | null;
  defaultPriceId?: string | null;
};

export function ConnectDashboard() {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);

  // Product form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("29.00");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/connect/account");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load Connect status");
        setAccount(null);
        return;
      }
      setAccount(data);
      if (data.accountId) {
        const pr = await fetch(
          `/api/connect/products?accountId=${encodeURIComponent(data.accountId)}`
        );
        const pd = await pr.json();
        if (pr.ok) setProducts(pd.products || []);
      }
    } catch {
      setError("Network error loading Connect status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createAccount() {
    setBusy("create");
    setError("");
    try {
      const res = await fetch("/api/connect/account", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account");
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  }

  async function startOnboarding() {
    setBusy("onboard");
    setError("");
    try {
      // Ensure account exists first
      if (!account?.accountId) {
        const c = await fetch("/api/connect/account", { method: "POST" });
        const cd = await c.json();
        if (!c.ok) {
          setError(cd.error || "Could not create account");
          return;
        }
      }
      const res = await fetch("/api/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start onboarding");
        return;
      }
      // Redirect to Stripe-hosted Account Link
      window.location.href = data.url;
    } finally {
      setBusy("");
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setBusy("product");
    setError("");
    try {
      const dollars = Number(priceDollars);
      const priceInCents = Math.round(dollars * 100);
      const res = await fetch("/api/connect/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          priceInCents,
          currency: "usd",
        }),
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
      setBusy("");
    }
  }

  async function platformSubscribe() {
    setBusy("sub");
    setError("");
    try {
      const res = await fetch("/api/connect/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Subscription checkout failed");
        return;
      }
      window.location.href = data.url;
    } finally {
      setBusy("");
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError("");
    try {
      const res = await fetch("/api/connect/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Billing portal failed");
        return;
      }
      window.location.href = data.url;
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Connect status…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {/* Status card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Stripe Connect
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-stone-900">
              Collect payments as a seller
            </h2>
            <p className="mt-2 max-w-xl text-sm text-stone-500">
              Create a connected account, complete onboarding, list products, and
              share your storefront. Status is always loaded live from Stripe.
            </p>
          </div>
          <Button variant="secondary" onClick={load} disabled={!!busy}>
            <RefreshCw className="h-4 w-4" /> Refresh status
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <StatusRow
            label="Connected account"
            value={
              account?.accountId ? (
                <code className="text-xs">{account.accountId}</code>
              ) : (
                "Not created"
              )
            }
          />
          <StatusRow
            label="Card payments"
            value={
              <Badge variant={account?.readyToProcessPayments ? "success" : "warning"}>
                {account?.cardPaymentsStatus || "n/a"}
              </Badge>
            }
          />
          <StatusRow
            label="Onboarding"
            value={
              account?.onboardingComplete ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <BadgeCheck className="h-4 w-4" /> Complete
                </span>
              ) : (
                <span className="text-amber-800">
                  Requirements: {account?.requirementsStatus || "pending"}
                </span>
              )
            }
          />
          <StatusRow
            label="Platform subscription"
            value={account?.connectSubscriptionStatus || "none"}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!account?.accountId && (
            <Button onClick={createAccount} disabled={!!busy}>
              {busy === "create" && <Loader2 className="h-4 w-4 animate-spin" />}
              Create connected account
            </Button>
          )}
          <Button onClick={startOnboarding} disabled={!!busy} variant="primary">
            {busy === "onboard" && <Loader2 className="h-4 w-4 animate-spin" />}
            Onboard to collect payments
          </Button>
          {account?.storefrontPath && (
            <Link href={account.storefrontPath} className="btn-secondary">
              <Store className="h-4 w-4" /> Open storefront
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </Card>

      {/* Products */}
      <Card>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-700" />
          <h3 className="font-display text-xl font-semibold">Your products</h3>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Products are created on your connected account (Stripe-Account header).
        </p>

        <form onSubmit={createProduct} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pname">Name</Label>
            <Input
              id="pname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend childcare package"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea
              id="pdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details customers will see"
            />
          </div>
          <div>
            <Label htmlFor="pprice">Price (USD)</Label>
            <Input
              id="pprice"
              type="number"
              min="0.50"
              step="0.01"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!!busy || !account?.accountId} className="w-full">
              {busy === "product" && <Loader2 className="h-4 w-4 animate-spin" />}
              Create product
            </Button>
          </div>
        </form>

        <ul className="mt-8 divide-y divide-stone-100 border-t border-stone-100">
          {products.length === 0 && (
            <li className="py-6 text-center text-sm text-stone-400">
              No products yet — create one above.
            </li>
          )}
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-stone-900">{p.name}</p>
                {p.description && (
                  <p className="text-sm text-stone-500 line-clamp-1">{p.description}</p>
                )}
                <p className="mt-1 text-xs text-stone-400">{p.id}</p>
              </div>
              <p className="font-semibold text-stone-800">
                {p.unitAmount != null
                  ? `$${(p.unitAmount / 100).toFixed(2)}`
                  : "—"}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Platform subscription */}
      <Card>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-teal-700" />
          <h3 className="font-display text-xl font-semibold">
            Seller plan (platform subscription)
          </h3>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Charge a subscription <strong>to</strong> the connected account using{" "}
          <code className="text-xs">customer_account</code>. Set{" "}
          <code className="text-xs">STRIPE_CONNECT_PLATFORM_PRICE_ID</code> first.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={platformSubscribe} disabled={!!busy || !account?.accountId}>
            {busy === "sub" && <Loader2 className="h-4 w-4 animate-spin" />}
            Subscribe to seller plan
          </Button>
          <Button
            variant="secondary"
            onClick={openPortal}
            disabled={!!busy || !account?.accountId}
          >
            {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
            Manage billing portal
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <div className="mt-1 text-sm text-stone-800">{value}</div>
    </div>
  );
}
