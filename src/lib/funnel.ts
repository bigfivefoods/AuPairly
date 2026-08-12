/**
 * Lightweight funnel events — logs + optional future analytics sink.
 * Safe to call from server or client (client posts to /api/funnel).
 */

export type FunnelEvent =
  | "signup"
  | "publish_listing"
  | "first_message"
  | "shortlist"
  | "apply_packet"
  | "apply_blocked_video"
  | "checkout_start"
  | "payment_success"
  | "house_swap_interest"
  | "invite_copy";

export function trackFunnel(
  event: FunnelEvent,
  props?: Record<string, string | number | boolean | null | undefined>
) {
  const payload = {
    event,
    props: props || {},
    t: new Date().toISOString(),
  };
  // Server-side structured log
  console.log("[funnel]", JSON.stringify(payload));
  return payload;
}

/** Client helper */
export async function trackFunnelClient(
  event: FunnelEvent,
  props?: Record<string, string | number | boolean | null | undefined>
) {
  try {
    await fetch("/api/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props }),
    });
  } catch {
    /* ignore */
  }
}
