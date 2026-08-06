/**
 * Backward-compatible helpers used by freemium billing (/api/billing/*).
 * New Connect sample code should prefer `@/lib/stripe-client`.
 */

import {
  getStripeClient,
  isStripeConfigured,
  StripeConfigError,
} from "@/lib/stripe-client";

export { getStripeClient, isStripeConfigured, StripeConfigError };

/** @deprecated Prefer getStripeClient() — returns null instead of throwing when unset. */
export function getStripe() {
  if (!isStripeConfigured()) return null;
  try {
    return getStripeClient();
  } catch {
    return null;
  }
}

export function stripeEnabled() {
  return (
    isStripeConfigured() &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
}
