/**
 * Login / session tracking for management monitoring + re-engagement.
 * Server-only.
 */

import { prisma } from "@/lib/prisma";
import {
  formatDuration,
  type LoginMonitoringStats,
} from "@/lib/login-monitor-types";

export { formatDuration };
export type { LoginMonitoringStats };

const HEARTBEAT_MS = 4 * 60 * 1000; // refresh at most every ~4 min from jwt

export async function startLoginSession(opts: {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<string | null> {
  try {
    const now = new Date();
    // Close any still-open sessions for this user (stale browser tabs)
    const open = await prisma.loginSession.findMany({
      where: { userId: opts.userId, endedAt: null },
      take: 10,
    });
    for (const s of open) {
      const sec = Math.max(
        0,
        Math.round((now.getTime() - s.startedAt.getTime()) / 1000)
      );
      await prisma.loginSession
        .update({
          where: { id: s.id },
          data: { endedAt: now, lastSeenAt: now, durationSec: sec },
        })
        .catch(() => null);
    }

    const session = await prisma.loginSession.create({
      data: {
        userId: opts.userId,
        startedAt: now,
        lastSeenAt: now,
        userAgent: opts.userAgent?.slice(0, 240) || null,
        ip: opts.ip?.slice(0, 80) || null,
      },
    });

    await prisma.user.update({
      where: { id: opts.userId },
      data: {
        lastLoginAt: now,
        lastActiveAt: now,
        loginCount: { increment: 1 },
      },
    });

    return session.id;
  } catch (e) {
    console.error("[login-sessions] start failed", e);
    return null;
  }
}

export async function heartbeatLoginSession(opts: {
  userId: string;
  sessionId?: string | null;
}): Promise<void> {
  try {
    const now = new Date();
    if (opts.sessionId) {
      const s = await prisma.loginSession.findUnique({
        where: { id: opts.sessionId },
      });
      if (s && s.userId === opts.userId && !s.endedAt) {
        if (now.getTime() - s.lastSeenAt.getTime() < HEARTBEAT_MS) return;
        await prisma.loginSession.update({
          where: { id: s.id },
          data: { lastSeenAt: now },
        });
        await prisma.user.update({
          where: { id: opts.userId },
          data: { lastActiveAt: now },
        });
        return;
      }
    }
    // Fallback: touch latest open session
    const open = await prisma.loginSession.findFirst({
      where: { userId: opts.userId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (open && now.getTime() - open.lastSeenAt.getTime() >= HEARTBEAT_MS) {
      await prisma.loginSession.update({
        where: { id: open.id },
        data: { lastSeenAt: now },
      });
    }
    await prisma.user.update({
      where: { id: opts.userId },
      data: { lastActiveAt: now },
    });
  } catch (e) {
    console.error("[login-sessions] heartbeat failed", e);
  }
}

export async function endLoginSession(opts: {
  userId?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  try {
    const now = new Date();
    if (opts.sessionId) {
      const s = await prisma.loginSession.findUnique({
        where: { id: opts.sessionId },
      });
      if (s && !s.endedAt) {
        const sec = Math.max(
          0,
          Math.round((now.getTime() - s.startedAt.getTime()) / 1000)
        );
        await prisma.loginSession.update({
          where: { id: s.id },
          data: { endedAt: now, lastSeenAt: now, durationSec: sec },
        });
        return;
      }
    }
    if (opts.userId) {
      const open = await prisma.loginSession.findMany({
        where: { userId: opts.userId, endedAt: null },
      });
      for (const s of open) {
        const sec = Math.max(
          0,
          Math.round((now.getTime() - s.startedAt.getTime()) / 1000)
        );
        await prisma.loginSession.update({
          where: { id: s.id },
          data: { endedAt: now, lastSeenAt: now, durationSec: sec },
        });
      }
    }
  } catch (e) {
    console.error("[login-sessions] end failed", e);
  }
}

export function sessionDurationSec(s: {
  startedAt: Date;
  lastSeenAt: Date;
  endedAt?: Date | null;
  durationSec?: number | null;
}): number {
  if (s.durationSec != null) return s.durationSec;
  const end = s.endedAt || s.lastSeenAt || new Date();
  return Math.max(0, Math.round((end.getTime() - s.startedAt.getTime()) / 1000));
}

export async function getLoginMonitoringStats(
  opts?: { recentLimit?: number }
): Promise<LoginMonitoringStats> {
  const limit = opts?.recentLimit ?? 25;
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const week = new Date(now - 7 * 86400000);
  const month = new Date(now - 30 * 86400000);
  const activeCutoff = new Date(now - 15 * 60 * 1000); // open + seen in 15m
  const d3 = new Date(now - 3 * 86400000);
  const d7 = new Date(now - 7 * 86400000);
  const d14 = new Date(now - 14 * 86400000);
  const d30 = new Date(now - 30 * 86400000);

  const [
    loginsToday,
    loginsWeek,
    loginsMonth,
    uniqueToday,
    uniqueWeek,
    activeNow,
    weekSessions,
    neverLoggedIn,
    inactive3d,
    inactive7d,
    inactive14d,
    inactive30d,
    recent,
    recentUsers,
  ] = await Promise.all([
    prisma.loginSession.count({ where: { startedAt: { gte: startOfDay } } }),
    prisma.loginSession.count({ where: { startedAt: { gte: week } } }),
    prisma.loginSession.count({ where: { startedAt: { gte: month } } }),
    prisma.loginSession.findMany({
      where: { startedAt: { gte: startOfDay } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.loginSession.findMany({
      where: { startedAt: { gte: week } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.loginSession.count({
      where: { endedAt: null, lastSeenAt: { gte: activeCutoff } },
    }),
    prisma.loginSession.findMany({
      where: { startedAt: { gte: week } },
      select: {
        startedAt: true,
        lastSeenAt: true,
        endedAt: true,
        durationSec: true,
      },
      take: 2000,
    }),
    prisma.user.count({
      where: {
        role: { in: ["AUPAIR", "PARENT"] },
        lastLoginAt: null,
        suspendedAt: null,
      },
    }),
    prisma.user.count({
      where: {
        role: { in: ["AUPAIR", "PARENT"] },
        suspendedAt: null,
        OR: [{ lastLoginAt: { lt: d3 } }, { lastLoginAt: null, createdAt: { lt: d3 } }],
      },
    }),
    prisma.user.count({
      where: {
        role: { in: ["AUPAIR", "PARENT"] },
        suspendedAt: null,
        OR: [{ lastLoginAt: { lt: d7 } }, { lastLoginAt: null, createdAt: { lt: d7 } }],
      },
    }),
    prisma.user.count({
      where: {
        role: { in: ["AUPAIR", "PARENT"] },
        suspendedAt: null,
        OR: [
          { lastLoginAt: { lt: d14 } },
          { lastLoginAt: null, createdAt: { lt: d14 } },
        ],
      },
    }),
    prisma.user.count({
      where: {
        role: { in: ["AUPAIR", "PARENT"] },
        suspendedAt: null,
        OR: [
          { lastLoginAt: { lt: d30 } },
          { lastLoginAt: null, createdAt: { lt: d30 } },
        ],
      },
    }),
    prisma.loginSession.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["AUPAIR", "PARENT"] }, suspendedAt: null },
      orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        lastActiveAt: true,
        loginCount: true,
      },
    }),
  ]);

  const durations = weekSessions
    .map((s) => sessionDurationSec(s))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const avgSessionSecWeek = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const medianSessionSecWeek = durations.length
    ? durations[Math.floor(durations.length / 2)]
    : 0;

  return {
    loginsToday,
    loginsWeek,
    loginsMonth,
    uniqueLoginsToday: uniqueToday.length,
    uniqueLoginsWeek: uniqueWeek.length,
    activeNow,
    avgSessionSecWeek,
    medianSessionSecWeek,
    neverLoggedIn,
    inactive3d,
    inactive7d,
    inactive14d,
    inactive30d,
    recentSessions: recent.map((s) => {
      const durationSec = sessionDurationSec(s);
      return {
        id: s.id,
        userId: s.user.id,
        name: s.user.name,
        email: s.user.email,
        role: s.user.role,
        startedAt: s.startedAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
        endedAt: s.endedAt?.toISOString() || null,
        durationSec,
        durationLabel: formatDuration(durationSec),
        open: !s.endedAt,
      };
    }),
    recentUsers: recentUsers.map((u) => {
      const ref = u.lastLoginAt || null;
      const daysSinceLogin = ref
        ? Math.floor((now - ref.getTime()) / 86400000)
        : null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        lastLoginAt: u.lastLoginAt?.toISOString() || null,
        lastActiveAt: u.lastActiveAt?.toISOString() || null,
        loginCount: u.loginCount,
        daysSinceLogin,
      };
    }),
  };
}
