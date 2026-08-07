/**
 * International identity verification via Didit (document + liveness).
 * Docs: https://docs.didit.me
 *
 * When DIDIT_API_KEY is set we create a verification session and return a
 * hosted URL the user completes. Webhook marks ID+SELFIE verified.
 *
 * Alternative providers (Persona, Sumsub, Veriff) can plug into the same
 * shape later — keep orchestration in /api/verification/kyc.
 */

const DIDIT_API =
  process.env.DIDIT_API_BASE || "https://verification.didit.me/v2";

export function isDiditConfigured() {
  return Boolean(process.env.DIDIT_API_KEY);
}

export type InternationalSession = {
  sessionId: string;
  url: string;
  provider: "didit" | "demo";
};

/**
 * Create a hosted ID verification session for non-SA users.
 */
export async function createInternationalSession(input: {
  userId: string;
  email: string;
  fullName: string;
  callbackUrl: string;
}): Promise<InternationalSession> {
  if (!isDiditConfigured()) {
    // Demo: no external vendor — caller should fall back to manual upload
    return {
      sessionId: `demo_${input.userId}_${Date.now()}`,
      url: "",
      provider: "demo",
    };
  }

  const res = await fetch(`${DIDIT_API}/session/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.DIDIT_API_KEY!,
    },
    body: JSON.stringify({
      vendor_data: input.userId,
      callback: input.callbackUrl,
      // Request document + liveness (exact fields depend on Didit dashboard workflow)
      features: ["OCR", "NFC", "FACE_MATCH", "LIVENESS"],
      contact_details: {
        email: input.email,
      },
      expected_details: {
        first_name: input.fullName.split(" ")[0],
        last_name: input.fullName.split(" ").slice(1).join(" ") || undefined,
      },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    session_id?: string;
    id?: string;
    url?: string;
    verification_url?: string;
    detail?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.detail || data.error || `Didit session failed (${res.status})`
    );
  }

  const sessionId = String(data.session_id || data.id || "");
  const url = String(data.url || data.verification_url || "");
  if (!sessionId || !url) {
    throw new Error("Didit did not return session_id/url");
  }

  return { sessionId, url, provider: "didit" };
}

export function verifyDiditWebhookSignature(
  _rawBody: string,
  _signature: string | null
): boolean {
  // Didit signs webhooks with a shared secret when configured.
  // When DIDIT_WEBHOOK_SECRET is unset, reject in production.
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  // Simple shared-secret header match; tighten when vendor docs specify HMAC.
  return _signature === secret || _signature === `Bearer ${secret}`;
}
