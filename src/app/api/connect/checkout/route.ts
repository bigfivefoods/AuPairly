import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Seller checkout is disabled. Use membership Billing instead.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
