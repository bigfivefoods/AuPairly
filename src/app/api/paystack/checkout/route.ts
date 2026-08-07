import { NextResponse } from "next/server";

/** Product checkout disabled — use /api/billing/checkout for subscriptions. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Product sales are not available on AuPairly. Subscribe via Billing or Pricing.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
