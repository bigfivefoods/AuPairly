import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export type NotificationType =
  | "MESSAGE"
  | "INTEREST"
  | "INTEREST_UPDATE"
  | "SYSTEM"
  | "REVIEW"
  | "MATCH"
  | "BILLING";

export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  meta?: Record<string, unknown>;
  /** When true (default), also attempt web push */
  push?: boolean;
}) {
  const row = await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      href: opts.href ?? null,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });

  if (opts.push !== false) {
    void sendPushToUser(opts.userId, {
      title: opts.title,
      body: opts.body,
      href: opts.href || "/dashboard",
      tag: opts.type.toLowerCase(),
    }).catch((e) => console.error("[push] notify", e));
  }

  return row;
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
