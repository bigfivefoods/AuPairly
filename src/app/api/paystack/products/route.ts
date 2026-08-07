import { NextResponse } from "next/server";

/** Seller product catalog disabled — platform is subscription-only. */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Product storefronts are not available. AuPairly only offers membership subscriptions.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Product storefronts are not available. AuPairly only offers membership subscriptions.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
