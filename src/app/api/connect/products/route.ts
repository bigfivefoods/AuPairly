import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "Seller storefronts are disabled. Subscriptions only.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Seller storefronts are disabled. Subscriptions only.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
