import "server-only";
import { PrivyClient } from "@privy-io/node";

/**
 * Server-side Privy client for verifying email OTP access tokens.
 * Requires PRIVY_APP_ID + PRIVY_APP_SECRET from https://dashboard.privy.io
 */

export function isPrivyConfigured(): boolean {
  return Boolean(
    process.env.PRIVY_APP_ID ||
      process.env.NEXT_PUBLIC_PRIVY_APP_ID
  ) && Boolean(process.env.PRIVY_APP_SECRET);
}

export function getPrivyAppId(): string {
  return (
    process.env.PRIVY_APP_ID ||
    process.env.NEXT_PUBLIC_PRIVY_APP_ID ||
    ""
  );
}

let client: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  const appId = getPrivyAppId();
  const appSecret = process.env.PRIVY_APP_SECRET || "";
  if (!appId || !appSecret) {
    throw new Error(
      "Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET."
    );
  }
  if (!client) {
    client = new PrivyClient({
      appId,
      appSecret,
      jwtVerificationKey: process.env.PRIVY_VERIFICATION_KEY,
    });
  }
  return client;
}

function extractEmailFromLinkedAccounts(
  linked: Array<{ type?: string; address?: string }> | undefined
): string | null {
  if (!linked?.length) return null;
  const emailAcct = linked.find((a) => a.type === "email" && a.address);
  return emailAcct?.address?.toLowerCase() ?? null;
}

/**
 * Verify a Privy access token and ensure it matches the given email.
 * Returns the Privy user id on success.
 */
export async function verifyPrivyEmailAccess(opts: {
  accessToken: string;
  email: string;
}): Promise<{ privyUserId: string; email: string }> {
  const email = opts.email.toLowerCase().trim();
  const privy = getPrivyClient();

  const claims = await privy.utils().auth().verifyAccessToken(opts.accessToken);
  const privyUser = await privy.users()._get(claims.user_id);
  const linked = (privyUser as { linked_accounts?: Array<{ type?: string; address?: string }> })
    .linked_accounts;
  const verifiedEmail = extractEmailFromLinkedAccounts(linked);

  if (!verifiedEmail) {
    throw new Error("Privy session has no verified email address.");
  }
  if (verifiedEmail !== email) {
    throw new Error("Verified email does not match the registration email.");
  }

  return { privyUserId: claims.user_id, email: verifiedEmail };
}
