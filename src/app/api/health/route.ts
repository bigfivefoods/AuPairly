import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrivyConfigured } from "@/lib/privy";
import { isPaystackConfigured, paystackMode } from "@/lib/paystack";

/**
 * Public readiness probe — no secrets.
 * GET /api/health
 */
export async function GET() {
  let database: "ok" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "error";
  }

  const privy = isPrivyConfigured();
  const paystack = isPaystackConfigured();
  const psMode = paystackMode();
  const resend = Boolean(process.env.RESEND_API_KEY?.trim());
  // Must be non-empty after trim — empty string still counts as "set" in some UIs
  const cronSecret = process.env.CRON_SECRET?.trim() || "";
  const cron = cronSecret.length >= 16;
  const autoVerify = process.env.AUTO_VERIFY === "true";
  const onVercelProd =
    process.env.VERCEL_ENV === "production" ||
    (process.env.VERCEL === "1" && process.env.NODE_ENV === "production");

  const ready =
    database === "ok" &&
    // In production, expect payments + email for full product
    (process.env.NODE_ENV !== "production" || (paystack && resend));

  return NextResponse.json(
    {
      ok: database === "ok",
      ready,
      checks: {
        database,
        privyConfigured: privy,
        paystackConfigured: paystack,
        paystackMode: psMode,
        paystackLive: psMode === "live",
        resendConfigured: resend,
        cronSecretSet: cron,
        autoVerify,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      },
      hints: {
        privy:
          privy
            ? "OK — OTP register enabled when client App ID is in build"
            : "Set NEXT_PUBLIC_PRIVY_APP_ID + PRIVY_APP_SECRET (see docs/PRIVY.md)",
        paystack: !paystack
          ? "Set PAYSTACK_SECRET_KEY + NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
          : psMode === "live"
            ? "OK — LIVE keys (real ZAR). Webhook: /api/billing/webhook"
            : onVercelProd && process.env.PAYSTACK_ALLOW_TEST !== "true"
              ? "TEST keys on production — checkout blocked until sk_live_/pk_live_ (or PAYSTACK_ALLOW_TEST=true)"
              : "TEST mode (sandbox) — set sk_live_/pk_live_ for real money",
        resend: resend
          ? "OK — match alert emails will send"
          : "Set RESEND_API_KEY + EMAIL_FROM for digest emails",
        cron: cron
          ? "OK"
          : "CRON_SECRET missing on this deployment. In Vercel: exact name CRON_SECRET, Environment=Production, then Redeploy (env vars only apply after redeploy).",
        autoVerify:
          autoVerify && onVercelProd
            ? "WARN — AUTO_VERIFY=true on production (badges auto-approve). Set false for real review."
            : autoVerify
              ? "AUTO_VERIFY on (ok for local/demo)"
              : "OK — manual verification review",
      },
    },
    { status: database === "ok" ? 200 : 503 }
  );
}
