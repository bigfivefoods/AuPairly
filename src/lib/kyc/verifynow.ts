/**
 * VerifyNow (South Africa) — https://www.verifynow.co.za/api-docs
 * Base: https://www.verifynow.co.za/api/external
 * Auth header: x-api-key: VERIFYNOW_API_KEY
 * Production requires Idempotency-Key.
 */

const API_BASE =
  process.env.VERIFYNOW_API_BASE || "https://www.verifynow.co.za/api/external";

export function isVerifyNowConfigured() {
  return Boolean(process.env.VERIFYNOW_API_KEY);
}

export function verifyNowMode(): "sandbox" | "production" {
  return process.env.VERIFYNOW_MODE === "production" ? "production" : "sandbox";
}

async function callVerifyNow<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  idempotencyKey: string
): Promise<T> {
  const key = process.env.VERIFYNOW_API_KEY;
  if (!key) {
    throw new Error("VERIFYNOW_API_KEY is not set");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ mode: verifyNowMode(), ...body }),
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ||
        `VerifyNow ${path} failed (${res.status})`
    );
  }
  return data;
}

/** Luhn-style SA ID checksum (13 digits). */
export function isValidSaIdNumber(id: string): boolean {
  const cleaned = id.replace(/\D/g, "");
  if (!/^\d{13}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = Number(cleaned[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export type SaIdVerifyResult = {
  ok: boolean;
  requestId?: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  citizenship?: string;
  statusText?: string;
  raw?: unknown;
};

/** SA national ID verification (Home Affairs-backed where available). */
export async function verifySaIdNumber(
  idNumber: string,
  idempotencyKey: string
): Promise<SaIdVerifyResult> {
  if (!isValidSaIdNumber(idNumber)) {
    return { ok: false, statusText: "Invalid South African ID number format" };
  }

  if (!isVerifyNowConfigured()) {
    // Demo path — format-valid only
    return {
      ok: true,
      statusText: "Demo: ID format valid (set VERIFYNOW_API_KEY for live KYC)",
      firstName: undefined,
      lastName: undefined,
    };
  }

  const data = await callVerifyNow<Record<string, unknown>>(
    "/verify",
    {
      reportType: "said_verification",
      idNumber: idNumber.replace(/\D/g, ""),
    },
    idempotencyKey
  );

  const results = (data.results || {}) as Record<string, unknown>;
  const said = (results.said_verification || results) as Record<string, unknown>;
  const rt = (said.realTimeResults || said) as Record<string, unknown>;
  const verification = (rt.Verification || rt.verification || {}) as Record<
    string,
    unknown
  >;
  const status =
    String(rt.Status || said.Status || data.success || "") || "unknown";

  const ok =
    Boolean(data.success) ||
    /valid|success/i.test(status) ||
    Boolean(verification.Firstnames || verification.firstnames);

  return {
    ok,
    requestId: String(data.requestId || ""),
    firstName: String(verification.Firstnames || verification.firstnames || ""),
    lastName: String(verification.Lastname || verification.lastname || ""),
    dob: String(verification.Dob || verification.dob || ""),
    gender: String(verification.Gender || verification.gender || ""),
    citizenship: String(
      verification.Citizenship || verification.citizenship || ""
    ),
    statusText: status,
    raw: data,
  };
}

export type FaceMatchResult = {
  ok: boolean;
  requestId?: string;
  statusText?: string;
  raw?: unknown;
};

/**
 * Face match: selfie vs Home Affairs photo (bundle facematch)
 * or selfie vs uploaded ID photo (bundle facematch_verified).
 */
export async function verifyFaceMatch(input: {
  idNumber: string;
  selfieBase64: string;
  /** If provided, compare to this reference instead of Home Affairs fetch */
  referenceImageBase64?: string;
  idempotencyKey: string;
}): Promise<FaceMatchResult> {
  if (!isVerifyNowConfigured()) {
    return {
      ok: true,
      statusText:
        "Demo: selfie accepted (set VERIFYNOW_API_KEY for live face match)",
    };
  }

  const useSupplied = Boolean(input.referenceImageBase64);
  const body = useSupplied
    ? {
        bundle: "facematch_verified",
        id_number: input.idNumber.replace(/\D/g, ""),
        selfie_image_base64: stripDataUrl(input.selfieBase64),
        reference_image_base64: stripDataUrl(input.referenceImageBase64!),
      }
    : {
        bundle: "facematch",
        id_number: input.idNumber.replace(/\D/g, ""),
        selfie_image_base64: stripDataUrl(input.selfieBase64),
      };

  const data = await callVerifyNow<Record<string, unknown>>(
    "/facematch",
    body,
    input.idempotencyKey
  );

  const ok =
    Boolean(data.success) ||
    /match|success|pass/i.test(JSON.stringify(data).slice(0, 500));

  return {
    ok,
    requestId: String(data.requestId || ""),
    statusText: ok ? "Face match passed" : "Face match failed or inconclusive",
    raw: data,
  };
}

function stripDataUrl(s: string) {
  const i = s.indexOf("base64,");
  return i >= 0 ? s.slice(i + 7) : s;
}
