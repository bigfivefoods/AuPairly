/**
 * Paystack client for AuPairly (South Africa).
 *
 * Why Paystack (not Stripe): SA company support + Apple Pay for ZA merchants.
 * Docs: https://paystack.com/docs/api/
 *
 * Env:
 *   PAYSTACK_SECRET_KEY=sk_test_... or sk_live_...
 *   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_... or pk_live_...
 *
 * Amounts are always in the smallest currency unit (ZAR cents / kobo).
 * Apple Pay: enable in Paystack Dashboard → Settings → Preferences.
 */

export class PaystackConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaystackConfigError";
  }
}

const BASE = "https://api.paystack.co";

export function getPaystackSecretKey(): string {
  // PLACEHOLDER — set in .env / Vercel
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.includes("sk_***") || key === "sk_test_YOUR_KEY") {
    throw new PaystackConfigError(
      "Missing PAYSTACK_SECRET_KEY. Create keys at https://dashboard.paystack.com/#/settings/developers " +
        "and add them to .env (or Vercel Environment Variables)."
    );
  }
  return key;
}

export function getPaystackPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!key || key.includes("pk_***")) {
    throw new PaystackConfigError(
      "Missing NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY. Add your Paystack public key to env."
    );
  }
  return key;
}

export function isPaystackConfigured(): boolean {
  const sk = process.env.PAYSTACK_SECRET_KEY;
  const pk = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  return Boolean(
    sk &&
      pk &&
      !sk.includes("sk_***") &&
      !pk.includes("pk_***") &&
      sk !== "sk_test_YOUR_KEY"
  );
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Default settlement currency for SA. */
export function paystackCurrency(): string {
  return (process.env.PAYSTACK_CURRENCY || "ZAR").toUpperCase();
}

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

/**
 * Low-level Paystack API helper. All server-side calls go through this.
 */
export async function paystackRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const secret = getPaystackSecretKey();
  const method = options.method || "GET";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackResponse<T> & { errors?: unknown };

  if (!res.ok || json.status === false) {
    const msg =
      json.message ||
      `Paystack request failed (${res.status}) for ${method} ${path}`;
    const err = new Error(msg) as Error & { status?: number; paystack?: unknown };
    err.status = res.status;
    err.paystack = json;
    throw err;
  }

  return json.data;
}

export type InitializeTransactionResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

/**
 * Start a hosted Paystack checkout (cards, Apple Pay when enabled, etc.).
 * Amount is in the smallest unit (e.g. R10.00 → 1000).
 */
export async function initializeTransaction(params: {
  email: string;
  amountCents: number;
  reference?: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  currency?: string;
  /** Optional subaccount code for marketplace splits */
  subaccount?: string;
  transactionCharge?: number;
  bearer?: "account" | "subaccount";
}): Promise<InitializeTransactionResult> {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: Math.round(params.amountCents),
    currency: params.currency || paystackCurrency(),
    callback_url: params.callbackUrl,
    // Apple Pay appears when enabled on the dashboard + channel allowed
    channels: params.channels || ["card", "apple_pay", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"],
    metadata: params.metadata || {},
  };
  if (params.reference) body.reference = params.reference;
  if (params.subaccount) {
    body.subaccount = params.subaccount;
    if (params.transactionCharge != null) body.transaction_charge = params.transactionCharge;
    if (params.bearer) body.bearer = params.bearer;
  }

  return paystackRequest<InitializeTransactionResult>("/transaction/initialize", {
    method: "POST",
    body,
  });
}

export type VerifyTransactionResult = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  customer: { email: string; customer_code?: string };
  metadata?: Record<string, unknown> | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export async function verifyTransaction(reference: string) {
  return paystackRequest<VerifyTransactionResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

/**
 * Verify Paystack webhook signature (HMAC SHA512 of raw body with secret key).
 * Header: x-paystack-signature
 */
export async function verifyPaystackSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;
  const secret = getPaystackSecretKey();
  const crypto = await import("crypto");
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

export function paystackErrorResponse(err: unknown, fallback = "Paystack request failed") {
  if (err instanceof PaystackConfigError) {
    return { error: err.message, code: "PAYSTACK_CONFIG" as const, status: 503 };
  }
  const message = err instanceof Error ? err.message : fallback;
  return { error: message, code: "PAYSTACK_ERROR" as const, status: 500 };
}

/** Generate a unique payment reference. */
export function makeReference(prefix = "aupairly") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
