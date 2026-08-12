/**
 * Funnel event names + client helper (browser-safe).
 * Server persistence lives in trackFunnel (dynamic prisma import).
 */

export type FunnelEventName =
  | "signup"
  | "publish_listing"
  | "first_message"
  | "shortlist"
  | "apply_packet"
  | "apply_blocked_video"
  | "checkout_start"
  | "payment_success"
  | "house_swap_interest"
  | "invite_copy"
  | "placement_start"
  | "account_delete";

/** @deprecated use FunnelEventName */
export type FunnelEvent = FunnelEventName;

export function trackFunnel(
  event: FunnelEventName,
  props?: Record<string, string | number | boolean | null | undefined>
) {
  const payload = {
    event,
    props: props || {},
    t: new Date().toISOString(),
  };
  console.log("[funnel]", JSON.stringify(payload));

  // Server-only persist (dynamic import so client bundles stay clean)
  if (typeof window === "undefined") {
    const userId =
      props?.userId != null && props.userId !== ""
        ? String(props.userId)
        : null;
    const role = props?.role != null ? String(props.role) : null;
    const rest = { ...(props || {}) };
    delete rest.userId;
    delete rest.role;
    void import("@/lib/prisma")
      .then(({ prisma }) =>
        prisma.funnelEvent.create({
          data: {
            event,
            userId,
            role,
            props: JSON.stringify(rest),
          },
        })
      )
      .catch((e) => console.error("[funnel] persist failed", e));
  }

  return payload;
}

/** Client helper */
export async function trackFunnelClient(
  event: FunnelEventName,
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

/** Aggregate last N days for ops dashboard (server only) */
export async function funnelSummary(days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.funnelEvent.groupBy({
      by: ["event"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });
    const map: Record<string, number> = {};
    for (const r of rows) map[r.event] = r._count.id;
    return { days, since: since.toISOString(), counts: map };
  } catch {
    return {
      days,
      since: since.toISOString(),
      counts: {} as Record<string, number>,
    };
  }
}
