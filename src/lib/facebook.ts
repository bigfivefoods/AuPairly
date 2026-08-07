/**
 * Meta / Facebook Login helpers for AuPairly profile import.
 *
 * Profile enrichment only (name, photo, email, profile link).
 * Not a substitute for government ID verification.
 *
 * Env:
 *   NEXT_PUBLIC_FACEBOOK_APP_ID  — public App ID (client SDK + OAuth)
 *   AUTH_FACEBOOK_ID             — same as App ID (optional alias)
 *   AUTH_FACEBOOK_SECRET         — App Secret (server only)
 *   FACEBOOK_APP_SECRET          — optional alias for secret
 */

import { createHmac } from "node:crypto";

export function facebookAppId(): string {
  return (
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
    process.env.AUTH_FACEBOOK_ID ||
    process.env.FACEBOOK_APP_ID ||
    ""
  ).trim();
}

export function facebookAppSecret(): string {
  return (
    process.env.AUTH_FACEBOOK_SECRET ||
    process.env.FACEBOOK_APP_SECRET ||
    ""
  ).trim();
}

export function isFacebookConfigured(): boolean {
  return Boolean(facebookAppId() && facebookAppSecret());
}

/** Public config safe to return to the browser */
export function facebookPublicConfig() {
  const appId = facebookAppId();
  return {
    configured: Boolean(appId && facebookAppSecret()),
    appId: appId || null,
    /** JS SDK can start with app id only; server import needs secret for best security */
    clientReady: Boolean(appId),
  };
}

export function facebookAppSecretProof(accessToken: string): string | null {
  const secret = facebookAppSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(accessToken).digest("hex");
}

export type FacebookProfile = {
  id: string;
  name?: string;
  email?: string;
  pictureUrl?: string | null;
  link?: string;
};

/**
 * Fetch /me with optional appsecret_proof (required by many Meta apps in production).
 */
export async function fetchFacebookProfile(
  accessToken: string
): Promise<FacebookProfile> {
  const fields = "id,name,email,picture.type(large),link";
  const proof = facebookAppSecretProof(accessToken);
  const params = new URLSearchParams({
    fields,
    access_token: accessToken,
  });
  if (proof) params.set("appsecret_proof", proof);

  const res = await fetch(
    `https://graph.facebook.com/v21.0/me?${params.toString()}`
  );
  const data = (await res.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
    link?: string;
    error?: { message?: string; type?: string; code?: number };
  };

  if (!res.ok || data.error || !data.id) {
    throw new Error(
      data.error?.message ||
        "Could not read Facebook profile. Check token, App ID, and permissions (public_profile, email)."
    );
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    pictureUrl: data.picture?.data?.url || null,
    link: data.link,
  };
}

/**
 * Exchange OAuth authorization code for a user access token.
 */
export async function exchangeFacebookCode(input: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const appId = facebookAppId();
  const secret = facebookAppSecret();
  if (!appId || !secret) {
    throw new Error("Facebook App ID/Secret not configured");
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: secret,
    redirect_uri: input.redirectUri,
    code: input.code,
  });

  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`
  );
  const data = (await res.json()) as {
    access_token?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error?.message || "Facebook code exchange failed"
    );
  }
  return data.access_token;
}

/**
 * Canonical public site for Facebook OAuth redirect_uri.
 * Always use https://www.aupairly.me in production so Meta App Domains match
 * (Domain Manager alone is not enough — Basic → App Domains must list aupairly.me).
 */
export function facebookOAuthSiteUrl(req?: Request | null): string {
  const env = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  // Production product host — force www so redirect_uri never drifts
  if (
    env.includes("aupairly.me") ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    // Prefer configured site if it's already aupairly; else hard default
    if (env.startsWith("https://www.aupairly.me")) return "https://www.aupairly.me";
    if (env.startsWith("https://aupairly.me")) return "https://www.aupairly.me";
    if (process.env.VERCEL_ENV === "production" || env.includes("aupairly.me")) {
      return "https://www.aupairly.me";
    }
  }

  // Local / preview: use request host or env
  if (req) {
    const host =
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      req.headers.get("host")?.trim() ||
      "";
    if (host.includes("localhost") || host.startsWith("127.")) {
      const proto = req.headers.get("x-forwarded-proto") || "http";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
    // Preview deployments on vercel.app — still prefer product domain for OAuth
    if (host.includes("aupairly.me")) {
      return "https://www.aupairly.me";
    }
  }

  if (env) return env;
  return "http://localhost:3000";
}

export function facebookOAuthDialogUrl(input: {
  redirectUri: string;
  state: string;
}): string | null {
  const appId = facebookAppId();
  if (!appId) return null;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: input.redirectUri,
    state: input.state,
    scope: "public_profile,email",
    response_type: "code",
    // Use page display (web) — avoid desktop/native app mode quirks
    display: "page",
  });
  // Unversioned dialog URL is more widely accepted for Login
  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
}
