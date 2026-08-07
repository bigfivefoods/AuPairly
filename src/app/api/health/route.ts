import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPrivyConfigured } from "@/lib/privy";
import { isPaystackConfigured } from "@/lib/paystack";

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
  const resend = Boolean(process.env.RESEND_API_KEY);
  const cron = Boolean(process.env.CRON_SECRET);

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
        resendConfigured: resend,
        cronSecretSet: cron,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      },
      hints: {
        privy:
          privy
            ? "OK — OTP register enabled when client App ID is in build"
            : "Set NEXT_PUBLIC_PRIVY_APP_ID + PRIVY_APP_SECRET (see docs/PRIVY.md)",
        paystack: paystack
          ? "OK — subscription checkout available"
          : "Set PAYSTACK_SECRET_KEY + NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY",
        resend: resend
          ? "OK — match alert emails will send"
          : "Set RESEND_API_KEY + EMAIL_FROM for digest emails",
        cron: cron
          ? "OK"
          : "Set CRON_SECRET for Vercel cron auth on /api/cron/*",
      },
    },
    { status: database === "ok" ? 200 : 503 }
  );
}
