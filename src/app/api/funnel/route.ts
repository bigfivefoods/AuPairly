import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackFunnel, type FunnelEvent } from "@/lib/funnel";

const ALLOWED = new Set<FunnelEvent>([
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
]);

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const event = body.event as FunnelEvent;
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
