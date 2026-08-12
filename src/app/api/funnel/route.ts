import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackFunnel, type FunnelEventName } from "@/lib/funnel";

const ALLOWED = new Set<FunnelEventName>([
  "signup",
  "publish_listing",
  "first_message",
  "shortlist",
  "apply_packet",
  "apply_blocked_video",
  "checkout_start",
  "payment_success",
  "house_swap_interest",
  "invite_copy",
  "placement_start",
  "account_delete",
]);

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const event = body.event as FunnelEventName;
  if (!event || !ALLOWED.has(event)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  trackFunnel(event, {
    ...(body.props || {}),
    userId: session?.user?.id || null,
    role: session?.user?.role || null,
  });
  return NextResponse.json({ ok: true });
}
