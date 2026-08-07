/**
 * VerifyNow (South Africa) API client
 * Docs: https://www.verifynow.co.za/api-docs
 *
 * Base URL: https://www.verifynow.co.za/api/external
 * Auth: x-api-key: VERIFYNOW_API_KEY (server-side only)
 * Production: Idempotency-Key required
 * Sandbox: same payloads, mode: "sandbox", 0 credits
 */

const API_BASE =
  process.env.VERIFYNOW_API_BASE || "https://www.verifynow.co.za/api/external";

export function isVerifyNowConfigured() {
  return Boolean((process.env.VERIFYNOW_API_KEY || "").trim());
}

/**
 * Live vs sandbox for VerifyNow API body `mode`.
 *
 * Rules (in order):
 * 1. vn_live_* keys always production — cannot be forced to sandbox unless
 *    VERIFYNOW_FORCE_SANDBOX=true (avoids accidental free/sandbox runs with live keys)
 * 2. vn_test_* keys always sandbox
 * 3. Explicit VERIFYNOW_MODE=production|live|sandbox|test
 * 4. Default sandbox
 */
export function verifyNowMode(): "sandbox" | "production" {
  const key = (process.env.VERIFYNOW_API_KEY || "").trim();
  const forceSandbox = process.env.VERIFYNOW_FORCE_SANDBOX === "true";

  if (key.startsWith("vn_live_")) {
    return forceSandbox ? "sandbox" : "production";
  }
  if (key.startsWith("vn_test_")) {
    return "sandbox";
  }

  const explicit = (process.env.VERIFYNOW_MODE || "").trim().toLowerCase();
  if (explicit === "production" || explicit === "live" || explicit === "prod") {
    return "production";
  }
  if (explicit === "sandbox" || explicit === "test" || explicit === "dev") {
    return "sandbox";
  }
  return "sandbox";
}

/** Silent “format only” demo — never on Vercel/production unless opted in */
export function allowVerifyNowDemoFallback(): boolean {
  if (process.env.VERIFYNOW_ALLOW_DEMO === "true") return true;
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return false;
  }
  return true;
}

type VerifyNowError = {
  error?: string;
  requiredCredits?: number;
  availableCredits?: number;
};

async function callVerifyNow<T = Record<string, unknown>>(
  path: string,
  body: Record<string, unknown>,
  idempotencyKey: string
): Promise<T> {
  const key = process.env.VERIFYNOW_API_KEY;
  if (!key) {
    throw new Error("VERIFYNOW_API_KEY is not set");
  }

  const mode = verifyNowMode();
  const headers: Record<string, string> = {
    "x-api-key": key,
    "Content-Type": "application/json",
  };
  // Required for production; harmless in sandbox
  if (mode === "production" || idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ mode, ...body }),
  });

  const data = (await res.json().catch(() => ({}))) as T & VerifyNowError;

  if (!res.ok) {
    if (res.status === 402) {
      throw new Error(
        data.error ||
          `Insufficient VerifyNow credits (need ${data.requiredCredits ?? "?"}, have ${data.availableCredits ?? "?"})`
      );
    }
    if (res.status === 409) {
      throw new Error(
        data.error || "Idempotency conflict — use a new Idempotency-Key"
      );
    }
    if (res.status === 429) {
      throw new Error(data.error || "VerifyNow rate limit exceeded — retry later");
    }
    throw new Error(
      data.error || `VerifyNow ${path} failed (${res.status})`
    );
  }
  return data;
}

/**
 * Official SA ID number check digit (13 digits).
 * Odd positions (0-based even indices) summed as-is; even indices doubled.
 */
export function isValidSaIdNumber(id: string): boolean {
  const cleaned = id.replace(/\D/g, "");
  if (!/^\d{13}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = Number(cleaned[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(cleaned[12]);
}

export type SaIdVerifyResult = {
  ok: boolean;
  requestId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  citizenship?: string;
  deceasedStatus?: string;
  alive?: boolean;
  statusText?: string;
  remainingCredits?: number;
  raw?: unknown;
};

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function parseIdentityFields(data: Record<string, unknown>): SaIdVerifyResult {
  const results = (data.results || {}) as Record<string, unknown>;

  // Prefer nested report blocks from various reportTypes
  const blocks = [
    results.said_verification,
    results.home_affairs_real_time_idv,
    results.kyc_bundle,
    results.consumer_trace,
    results["marital-status-real-time"],
    results,
  ].filter(Boolean) as Record<string, unknown>[];

  let firstName = "";
  let lastName = "";
  let fullName = "";
  let dob = "";
  let gender = "";
  let citizenship = "";
  let deceasedStatus = "";
  let statusText = "";
  let ok = Boolean(data.success);

  for (const block of blocks) {
    const status = pickStr(block.Status, block.status);
    if (status) statusText = status;
    if (/success|valid|matched/i.test(status)) ok = true;

    const rt = (block.realTimeResults ||
      block.result ||
      block.Verification ||
      block) as Record<string, unknown>;
    const verification = (rt.Verification ||
      rt.verification ||
      rt) as Record<string, unknown>;

    firstName =
      firstName ||
      pickStr(
        verification.Firstnames,
        verification.firstNames,
        verification.FirstNames,
        verification.firstnames,
        rt.firstNames,
        rt.First_Name,
        rt.FirstNames
      );
    lastName =
      lastName ||
      pickStr(
        verification.Lastname,
        verification.surName,
        verification.Surname,
        verification.lastname,
        rt.surName,
        rt.Surname
      );
    fullName =
      fullName ||
      pickStr(rt.full_name, block.full_name) ||
      [firstName, lastName].filter(Boolean).join(" ");
    dob =
      dob ||
      pickStr(
        verification.Dob,
        verification.dob,
        verification.DOB,
        verification.DateOfBirth,
        rt.dob,
        rt.DOB,
        rt.date_of_birth,
        rt.DateOfBirth
      );
    gender =
      gender ||
      pickStr(verification.Gender, verification.gender, rt.gender, rt.Gender);
    citizenship =
      citizenship ||
      pickStr(
        verification.Citizenship,
        verification.citizenship,
        rt.citizenship,
        rt.Citizenship
      );
    deceasedStatus =
      deceasedStatus ||
      pickStr(
        rt.deceasedStatus,
        rt.alive_deceased_status,
        block.alive_deceased_status,
        block.deceased
      );

    const idMatch = pickStr(rt.idnoMatchStatus, rt.Status, rt.status);
    if (/matched|valid|success/i.test(idMatch)) ok = true;
    if (firstName || lastName || fullName) ok = true;
  }

  // Deceased → fail for marketplace onboarding
  const deceased =
    /deceased|yes|^y$|^d$/i.test(deceasedStatus) &&
    !/^alive$/i.test(deceasedStatus);

  if (deceased) {
    ok = false;
    statusText = `Record marked deceased (${deceasedStatus})`;
  }

  return {
    ok,
    requestId: pickStr(data.requestId),
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    fullName: fullName || undefined,
    dob: dob || undefined,
    gender: gender || undefined,
    citizenship: citizenship || undefined,
    deceasedStatus: deceasedStatus || undefined,
    alive: deceased ? false : deceasedStatus ? true : undefined,
    statusText: statusText || (ok ? "ID verified" : "ID verification failed"),
    remainingCredits:
      typeof data.remainingCredits === "number"
        ? data.remainingCredits
        : undefined,
    raw: data,
  };
}

/**
 * Preferred marketplace path: Standard KYC Bundle
 * (Home Affairs ID photo + Consumer/Person Trace Lite)
 * Falls back to said_verification if bundle fails.
 */
export async function verifySaIdNumber(
  idNumber: string,
  idempotencyKey: string
): Promise<SaIdVerifyResult> {
  const cleaned = idNumber.replace(/\D/g, "");
  if (!isValidSaIdNumber(cleaned)) {
    return { ok: false, statusText: "Invalid South African ID number format" };
  }

  if (!isVerifyNowConfigured()) {
    if (!allowVerifyNowDemoFallback()) {
      return {
        ok: false,
        statusText:
          "VerifyNow is not live on this server. Set VERIFYNOW_API_KEY (and VERIFYNOW_MODE=production) in Vercel, then redeploy.",
      };
    }
    return {
      ok: true,
      statusText:
        "Demo: ID format valid only (set VERIFYNOW_API_KEY for live VerifyNow KYC)",
    };
  }

  // 1) Prefer Standard KYC Bundle for marketplace onboarding
  try {
    const bundleData = await callVerifyNow<Record<string, unknown>>(
      "/verify",
      {
        bundle: "kyc_bundle",
        idNumber: cleaned,
      },
      `${idempotencyKey}:kyc_bundle`
    );
    const parsed = parseIdentityFields(bundleData);
    if (parsed.ok || bundleData.success) {
      return {
        ...parsed,
        ok: parsed.ok || Boolean(bundleData.success),
        statusText: parsed.statusText || "KYC bundle completed",
      };
    }
  } catch (e) {
    // Bundle may be unavailable on some accounts — fall through
    console.warn("[verifynow] kyc_bundle failed, falling back", e);
  }

  // 2) Basic SAID verification (core identity fields)
  const data = await callVerifyNow<Record<string, unknown>>(
    "/verify",
    {
      reportType: "said_verification",
      idNumber: cleaned,
    },
    `${idempotencyKey}:said`
  );

  return parseIdentityFields(data);
}

/**
 * Enhanced Home Affairs real-time IDV (alive/deceased + richer fields).
 * Use as step-up for higher assurance.
 */
export async function verifySaIdEnhanced(
  idNumber: string,
  idempotencyKey: string
): Promise<SaIdVerifyResult> {
  const cleaned = idNumber.replace(/\D/g, "");
  if (!isValidSaIdNumber(cleaned)) {
    return { ok: false, statusText: "Invalid South African ID number format" };
  }
  if (!isVerifyNowConfigured()) {
    if (!allowVerifyNowDemoFallback()) {
      return {
        ok: false,
        statusText: "VerifyNow is not live (VERIFYNOW_API_KEY missing).",
      };
    }
    return {
      ok: true,
      statusText: "Demo: enhanced ID skipped (no API key)",
    };
  }

  const data = await callVerifyNow<Record<string, unknown>>(
    "/verify",
    {
      reportType: "home_affairs_real_time_idv",
      idNumber: cleaned,
    },
    idempotencyKey
  );
  return parseIdentityFields(data);
}

export type FaceMatchResult = {
  ok: boolean;
  requestId?: string;
  statusText?: string;
  remainingCredits?: number;
  raw?: unknown;
};

/**
 * POST /facematch
 * - bundle "facematch": selfie vs Home Affairs photo
 * - bundle "facematch_verified": selfie vs supplied reference image (+ basic SA ID)
 *
 * Images: JPG/JPEG, PNG, WEBP or TIFF, up to 5 MB (base64 without data-URL prefix preferred).
 */
export async function verifyFaceMatch(input: {
  idNumber: string;
  selfieBase64: string;
  referenceImageBase64?: string;
  idempotencyKey: string;
}): Promise<FaceMatchResult> {
  if (!isVerifyNowConfigured()) {
    if (!allowVerifyNowDemoFallback()) {
      return {
        ok: false,
        statusText:
          "VerifyNow face match is not live. Set VERIFYNOW_API_KEY on the server.",
      };
    }
    return {
      ok: true,
      statusText:
        "Demo: selfie accepted (set VERIFYNOW_API_KEY for live face match)",
    };
  }

  const idNumber = input.idNumber.replace(/\D/g, "");
  const useSupplied = Boolean(input.referenceImageBase64);

  const body = useSupplied
    ? {
        bundle: "facematch_verified",
        id_number: idNumber,
        selfie_image_base64: stripDataUrl(input.selfieBase64),
        reference_image_base64: stripDataUrl(input.referenceImageBase64!),
      }
    : {
        bundle: "facematch",
        id_number: idNumber,
        selfie_image_base64: stripDataUrl(input.selfieBase64),
      };

  const data = await callVerifyNow<Record<string, unknown>>(
    "/facematch",
    body,
    input.idempotencyKey
  );

  const blob = JSON.stringify(data).toLowerCase();
  const ok =
    Boolean(data.success) ||
    (/match|pass|success|verified/.test(blob) &&
      !/no[_\s-]?match|fail|mismatch|reject/.test(blob.slice(0, 800)));

  return {
    ok,
    requestId: pickStr(data.requestId),
    statusText: ok
      ? useSupplied
        ? "Face match passed (selfie vs ID photo)"
        : "Face match passed (selfie vs Home Affairs)"
      : "Face match failed or inconclusive",
    remainingCredits:
      typeof data.remainingCredits === "number"
        ? data.remainingCredits
        : undefined,
    raw: data,
  };
}

export async function getVerifyNowCredits(): Promise<{
  available: number;
  source?: string;
  organizationName?: string;
} | null> {
  if (!isVerifyNowConfigured()) return null;
  const res = await fetch(`${API_BASE}/my_credits`, {
    headers: { "x-api-key": process.env.VERIFYNOW_API_KEY! },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    available_credits?: number;
    source?: string;
    organizationName?: string;
  };
  return {
    available: Number(data.available_credits ?? 0),
    source: data.source,
    organizationName: data.organizationName,
  };
}

export async function verifyNowHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

function stripDataUrl(s: string) {
  const i = s.indexOf("base64,");
  return i >= 0 ? s.slice(i + 7) : s;
}
