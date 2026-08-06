import { prisma } from "@/lib/prisma";

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
}) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      href: opts.href ?? null,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
    },
  });
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
