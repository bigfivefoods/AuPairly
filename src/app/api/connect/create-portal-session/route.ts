import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Seller portal is disabled. Manage membership under Billing.",
      upgradeUrl: "/billing",
    },
    { status: 410 }
  );
}
