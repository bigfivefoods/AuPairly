import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Seller payouts are not offered. AuPairly bills subscriptions only.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
