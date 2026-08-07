import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Seller plans are disabled. Use platform membership Billing.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
