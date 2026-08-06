import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@aupairly.me";

  if (!publicKey || !privateKey) {
    return false;
  }
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
}

export function isPushConfigured() {
  return Boolean(
    (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY) &&
      process.env.VAPID_PRIVATE_KEY
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || null;
}

export type PushPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
};

/** Send web push to all of a user's devices. Silently no-ops if unconfigured. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureVapid()) return { sent: 0, skipped: true as const };

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: 0, skipped: false as const };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href || "/dashboard",
    tag: payload.tag || "aupairly",
  });

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 60 * 60 * 12, urgency: "normal" }
        );
        sent += 1;
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        // Gone / expired subscription
        if (status === 404 || status === 410) {
          stale.push(sub.id);
        } else {
          console.error("[push] send failed", status || err);
        }
      }
    })
  );

  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
  }

  return { sent, skipped: false as const };
}
