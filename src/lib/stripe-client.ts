/**
 * Stripe Client factory for AuPairly.
 *
 * ALL Stripe API calls in the Connect sample should go through `getStripeClient()`.
 * Do not set apiVersion manually — the SDK ships with the latest API version
 * (currently 2026-07-29.dahlia) automatically.
 *
 * Required env:
 *   STRIPE_SECRET_KEY=sk_test_... or sk_live_...
 *
 * Optional / flow-specific:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...              // classic (v1) webhooks
 *   STRIPE_THIN_WEBHOOK_SECRET=whsec_...         // thin / V2 event destinations
 *   STRIPE_CONNECT_PLATFORM_PRICE_ID=price_...  // platform subscription for sellers
 *   STRIPE_APPLICATION_FEE_BPS=250              // 2.5% platform fee on direct charges
 */

import Stripe from "stripe";

/** Helpful error when a required Stripe env value is missing. */
export class StripeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeConfigError";
  }
}

let cachedClient: Stripe | null = null;

/**
 * Create (or reuse) a Stripe Client.
 *
 * PLACEHOLDER: set STRIPE_SECRET_KEY in `.env` / Vercel Environment Variables.
 * Get keys from: https://dashboard.stripe.com/apikeys
 */
export function getStripeClient(): Stripe {
  // PLACEHOLDER — replace with your real secret key via env, never hard-code it.
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.includes("sk_***") || secretKey === "sk_test_YOUR_KEY") {
    throw new StripeConfigError(
      "Missing STRIPE_SECRET_KEY. Add your Stripe secret key (starts with sk_test_ or sk_live_) " +
        "to .env or Vercel → Settings → Environment Variables. " +
        "See https://dashboard.stripe.com/apikeys"
    );
  }

  if (!cachedClient) {
    // stripeClient — used for ALL Stripe requests (Connect V2 + V1 products/checkout).
    cachedClient = new Stripe(secretKey);
  }

  return cachedClient;
}

/** Soft check used by UI to show setup guidance without throwing. */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.includes("sk_***") && key !== "sk_test_YOUR_KEY");
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Application fee in cents for a given charge amount.
 * Default: 250 bps (2.5%). Override with STRIPE_APPLICATION_FEE_BPS.
 */
export function applicationFeeAmount(unitAmountCents: number, quantity = 1): number {
  const bps = Number(process.env.STRIPE_APPLICATION_FEE_BPS || "250");
  const total = unitAmountCents * quantity;
  return Math.max(0, Math.round((total * bps) / 10_000));
}

/**
 * Platform price ID for charging connected accounts a subscription.
 * PLACEHOLDER: create a Product + recurring Price in the Stripe Dashboard
 * on the *platform* account, then set STRIPE_CONNECT_PLATFORM_PRICE_ID.
 */
export function getPlatformPriceId(): string {
  const priceId = process.env.STRIPE_CONNECT_PLATFORM_PRICE_ID;
  if (!priceId || priceId.startsWith("price_***") || priceId === "price_YOUR_PLATFORM_PRICE") {
    throw new StripeConfigError(
      "Missing STRIPE_CONNECT_PLATFORM_PRICE_ID. Create a recurring Price on your " +
        "platform Stripe account and set its ID (price_...) in env. " +
        "See https://dashboard.stripe.com/products"
    );
  }
  return priceId;
}

export function getThinWebhookSecret(): string {
  // Prefer dedicated thin destination secret; fall back to STRIPE_WEBHOOK_SECRET.
  const secret =
    process.env.STRIPE_THIN_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("whsec_***")) {
    throw new StripeConfigError(
      "Missing STRIPE_THIN_WEBHOOK_SECRET (or STRIPE_WEBHOOK_SECRET). " +
        "Create a thin event destination in Stripe Dashboard → Developers → Webhooks " +
        "for Connected accounts, then paste the signing secret."
    );
  }
  return secret;
}

export function getClassicWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("whsec_***")) {
    throw new StripeConfigError(
      "Missing STRIPE_WEBHOOK_SECRET. Create a webhook endpoint in " +
        "Stripe Dashboard → Developers → Webhooks and paste the signing secret."
    );
  }
  return secret;
}

/** Map StripeConfigError → JSON response helper. */
export function stripeErrorResponse(err: unknown, fallback = "Stripe request failed") {
  if (err instanceof StripeConfigError) {
    return { error: err.message, code: "STRIPE_CONFIG" as const, status: 503 };
  }
  const message = err instanceof Error ? err.message : fallback;
  return { error: message, code: "STRIPE_ERROR" as const, status: 500 };
}
