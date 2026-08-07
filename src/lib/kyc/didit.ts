/**
 * International identity verification via Didit (document + liveness).
 * Docs: https://docs.didit.me
 *
 * API v3:
 *   POST https://verification.didit.me/v3/session/
 *   Header: x-api-key
 *   Body: { workflow_id, vendor_data, callback, contact_details?, expected_details? }
 *
 * Env:
 *   DIDIT_API_KEY       — Business Console API key (server only)
 *   DIDIT_WORKFLOW_ID   — published KYC workflow UUID from Didit Console
 *   DIDIT_WEBHOOK_SECRET — destination secret_shared_key for webhooks
 *   DIDIT_API_BASE      — optional override (default v3 base)
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const DIDIT_API =
  process.env.DIDIT_API_BASE || "https://verification.didit.me/v3";

export function diditApiKey(): string {
  return (process.env.DIDIT_API_KEY || "").trim();
}

export function diditWorkflowId(): string {
  return (process.env.DIDIT_WORKFLOW_ID || "").trim();
}

export function diditWebhookSecret(): string {
  return (process.env.DIDIT_WEBHOOK_SECRET || "").trim();
}

/** API key + published workflow — enough to start hosted sessions */
export function isDiditConfigured() {
  return Boolean(diditApiKey() && diditWorkflowId());
}

/**
 * Production-ready: sessions + signed webhooks.
 * Without DIDIT_WEBHOOK_SECRET, sessions can start but status relies on
 * callback sync only (webhooks rejected in production).
 */
export function isDiditLive() {
  return isDiditConfigured() && Boolean(diditWebhookSecret());
}

export function diditPublicStatus() {
  return {
    configured: isDiditConfigured(),
    live: isDiditLive(),
    workflowIdSet: Boolean(diditWorkflowId()),
    webhookConfigured: Boolean(diditWebhookSecret()),
    apiBase:
      process.env.DIDIT_API_BASE || "https://verification.didit.me/v3",
  };
}

export type InternationalSession = {
  sessionId: string;
  url: string;
  provider: "didit" | "demo";
  status?: string;
};

/**
 * Create a hosted ID verification session for non-SA users.
 */
export async function createInternationalSession(input: {
  userId: string;
  email: string;
  fullName: string;
  callbackUrl: string;
  country?: string;
}): Promise<InternationalSession> {
  if (!isDiditConfigured()) {
    // Never silent-demo on Vercel/production — force explicit manual fallback
    if (
      process.env.VERCEL === "1" ||
      process.env.NODE_ENV === "production"
    ) {
      throw new Error(
        "Didit is not configured for live KYC. Set DIDIT_API_KEY and DIDIT_WORKFLOW_ID on the server (see DIDIT.md)."
      );
    }
    return {
      sessionId: `demo_${input.userId}_${Date.now()}`,
      url: "",
      provider: "demo",
    };
  }

  const parts = input.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || undefined;
  const lastName = parts.slice(1).join(" ") || undefined;

  const body: Record<string, unknown> = {
    workflow_id: diditWorkflowId(),
    vendor_data: input.userId,
    callback: input.callbackUrl,
    callback_method: "both",
    metadata: {
      source: "aupairly",
      country: input.country || null,
    },
    contact_details: input.email
      ? {
          email: input.email,
          send_notification_emails: false,
        }
      : undefined,
    expected_details:
      firstName || lastName
        ? {
            first_name: firstName,
            last_name: lastName,
          }
        : undefined,
  };

  const res = await fetch(`${DIDIT_API}/session/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": diditApiKey(),
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as {
    session_id?: string;
    id?: string;
    url?: string;
    verification_url?: string;
    status?: string;
    detail?: string | string[];
    error?: string;
    workflow_id?: string | string[];
  };

  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.join("; ")
          : data.error ||
            (typeof data.workflow_id === "string"
              ? data.workflow_id
              : Array.isArray(data.workflow_id)
                ? data.workflow_id.join("; ")
                : null);
    throw new Error(detail || `Didit session failed (${res.status})`);
  }

  const sessionId = String(data.session_id || data.id || "");
  const url = String(data.url || data.verification_url || "");
  if (!sessionId || !url) {
    throw new Error("Didit did not return session_id/url");
  }

  return {
    sessionId,
    url,
    provider: "didit",
    status: data.status,
  };
}

/** Fetch decision for a session (fallback when webhook is delayed). */
export async function fetchDiditSessionDecision(sessionId: string): Promise<{
  status: string;
  vendorData?: string;
}> {
  if (!diditApiKey()) {
    throw new Error("Didit not configured");
  }
  const res = await fetch(`${DIDIT_API}/session/${sessionId}/decision/`, {
    headers: { "x-api-key": diditApiKey() },
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    vendor_data?: string;
    detail?: string;
  };
  if (!res.ok) {
    throw new Error(data.detail || `Didit decision fetch failed (${res.status})`);
  }
  return {
    status: String(data.status || ""),
    vendorData: data.vendor_data,
  };
}

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        shortenFloats(v),
      ])
    );
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Verify Didit webhook signatures (X-Signature-V2 preferred).
 * @see https://docs.didit.me/integration/webhooks
 */
export function verifyDiditWebhookSignature(
  rawBody: string,
  headers: {
    signatureV2?: string | null;
    signature?: string | null;
    signatureSimple?: string | null;
    timestamp?: string | null;
  }
): boolean {
  const secret = (process.env.DIDIT_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    // Dev only: allow unsigned when secret unset
    return process.env.NODE_ENV !== "production";
  }

  const ts = headers.timestamp;
  if (ts) {
    const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(ts, 10));
    if (Number.isNaN(age) || age > 300) return false;
  }

  // V2: canonical sorted JSON
  if (headers.signatureV2) {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));
      const expected = createHmac("sha256", secret)
        .update(canonical, "utf8")
        .digest("hex");
      if (safeEqualHex(expected, headers.signatureV2)) return true;
    } catch {
      /* try other variants */
    }
  }

  // Raw body signature
  if (headers.signature) {
    const expected = createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    if (safeEqualHex(expected, headers.signature)) return true;
  }

  // Simple envelope signature
  if (headers.signatureSimple) {
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;
      const canonical = [
        body.timestamp ?? "",
        body.session_id ?? "",
        body.status ?? "",
        body.webhook_type ?? "",
      ].join(":");
      const expected = createHmac("sha256", secret)
        .update(canonical, "utf8")
        .digest("hex");
      if (safeEqualHex(expected, headers.signatureSimple)) return true;
    } catch {
      return false;
    }
  }

  return false;
}

/** Map Didit session status → our verification outcome */
export function diditStatusOutcome(
  status: string
): "VERIFIED" | "REJECTED" | "PENDING" | "ignore" {
  const s = status.trim();
  if (s === "Approved") return "VERIFIED";
  if (s === "Declined") return "REJECTED";
  if (s === "In Review" || s === "In Progress" || s === "Resubmitted" || s === "Awaiting User") {
    return "PENDING";
  }
  if (s === "Expired" || s === "Kyc Expired" || s === "Abandoned") {
    return "REJECTED";
  }
  return "ignore";
}
