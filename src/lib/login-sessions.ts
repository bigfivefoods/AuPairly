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
        await prisma.user
          .updateMany({
            where: { id: opts.userId, lastLoginAt: null },
            data: { lastLoginAt: s.startedAt },
          })
          .catch(() => null);
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
    // Backfill lastLoginAt once for users active before login tracking shipped
    await prisma.user
      .updateMany({
        where: { id: opts.userId, lastLoginAt: null },
        data: { lastLoginAt: now },
      })
      .catch(() => null);
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

function maxDate(
  ...dates: (Date | null | undefined)[]
): Date | null {
  let best: Date | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (!best || d.getTime() > best.getTime()) best = d;
  }
  return best;
}

/**
 * Effective last login for display + idle metrics.
 * Prefer lastLoginAt, then latest LoginSession, then lastActiveAt (pre-tracking activity).
 */
function resolveLastLogin(opts: {
  lastLoginAt?: Date | null;
  lastActiveAt?: Date | null;
  sessionStartedAt?: Date | null;
}): { at: Date | null; source: "login" | "session" | "activity" | "none" } {
  if (opts.lastLoginAt) return { at: opts.lastLoginAt, source: "login" };
  if (opts.sessionStartedAt)
    return { at: opts.sessionStartedAt, source: "session" };
  if (opts.lastActiveAt) return { at: opts.lastActiveAt, source: "activity" };
  return { at: null, source: "none" };
}

export async function getLoginMonitoringStats(
  opts?: { recentLimit?: number }
): Promise<LoginMonitoringStats> {
  const { getManagementEmails, isManagementEmail } = await import(
    "@/lib/management"
  );
  const mgmtEmails = getManagementEmails().map((e) => e.toLowerCase());

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
    recent,
    memberUsers,
    managementDbUsers,
    latestSessions,
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
    prisma.loginSession.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    // Members + anyone with sessions (include ADMIN / management roles)
    prisma.user.findMany({
      where: {
        suspendedAt: null,
        OR: [
          { role: { in: ["AUPAIR", "PARENT", "ADMIN"] } },
          { email: { in: mgmtEmails, mode: "insensitive" } },
          { lastLoginAt: { not: null } },
          { lastActiveAt: { not: null } },
        ],
      },
      orderBy: [{ lastLoginAt: "desc" }, { lastActiveAt: "desc" }, { createdAt: "desc" }],
      take: Math.max(limit * 2, 60),
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
    // Always load full management allowlist by email
    prisma.user.findMany({
      where: {
        email: { in: mgmtEmails, mode: "insensitive" },
      },
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
    // Latest session per user (for backfill when lastLoginAt is null)
    prisma.loginSession.findMany({
      orderBy: { startedAt: "desc" },
      take: 500,
      select: { userId: true, startedAt: true },
    }),
  ]);

  const latestSessionByUser = new Map<string, Date>();
  for (const s of latestSessions) {
    if (!latestSessionByUser.has(s.userId)) {
      latestSessionByUser.set(s.userId, s.startedAt);
    }
  }

  // Best-effort backfill lastLoginAt from activity/session so “never” goes away
  const toBackfill: { id: string; at: Date }[] = [];
  for (const u of [...memberUsers, ...managementDbUsers]) {
    if (u.lastLoginAt) continue;
    const sessionAt = latestSessionByUser.get(u.id) || null;
    const derived = maxDate(sessionAt, u.lastActiveAt);
    if (derived) toBackfill.push({ id: u.id, at: derived });
  }
  // Cap writes
  for (const row of toBackfill.slice(0, 80)) {
    void prisma.user
      .update({
        where: { id: row.id },
        data: {
          lastLoginAt: row.at,
          // Keep loginCount at least 1 if we know they were here
          ...(row.at
            ? {}
            : {}),
        },
      })
      .catch(() => null);
  }

  function mapUserRow(u: {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    lastActiveAt: Date | null;
    loginCount: number;
  }) {
    const sessionAt = latestSessionByUser.get(u.id) || null;
    // After backfill request, still compute effective from raw fields
    const resolved = resolveLastLogin({
      lastLoginAt: u.lastLoginAt,
      lastActiveAt: u.lastActiveAt,
      sessionStartedAt: sessionAt,
    });
    const daysSinceLogin = resolved.at
      ? Math.floor((now - resolved.at.getTime()) / 86400000)
      : null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      lastLoginAt: resolved.at?.toISOString() || null,
      lastActiveAt: u.lastActiveAt?.toISOString() || null,
      loginCount: Math.max(u.loginCount || 0, resolved.at ? 1 : 0),
      daysSinceLogin,
      isManagement: isManagementEmail(u.email),
      lastLoginSource: resolved.source,
    };
  }

  const managementByEmail = new Map(
    managementDbUsers.map((u) => [u.email.toLowerCase(), u])
  );

  const managementUsers: LoginMonitoringStats["managementUsers"] = mgmtEmails.map(
    (email) => {
      const u = managementByEmail.get(email);
      if (!u) {
        return {
          id: null,
          name: email.split("@")[0],
          email,
          role: null,
          lastLoginAt: null,
          lastActiveAt: null,
          loginCount: 0,
          daysSinceLogin: null,
          isManagement: true as const,
          lastLoginSource: "none" as const,
          registered: false,
        };
      }
      const mapped = mapUserRow(u);
      return {
        ...mapped,
        id: u.id,
        isManagement: true as const,
        registered: true,
      };
    }
  );

  // Merge members + management into recentUsers, de-dupe by id
  const byId = new Map<string, ReturnType<typeof mapUserRow>>();
  for (const u of memberUsers) {
    byId.set(u.id, mapUserRow(u));
  }
  for (const u of managementDbUsers) {
    byId.set(u.id, mapUserRow(u));
  }
  const recentUsers = [...byId.values()]
    .sort((a, b) => {
      // Management first, then by last login
      if (a.isManagement !== b.isManagement) return a.isManagement ? -1 : 1;
      const ta = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      const tb = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, limit + mgmtEmails.length);

  // Idle / never counts use effective last activity (lastLogin || lastActive)
  const allForIdle = await prisma.user.findMany({
    where: {
      suspendedAt: null,
      OR: [
        { role: { in: ["AUPAIR", "PARENT"] } },
        { email: { in: mgmtEmails, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      lastLoginAt: true,
      lastActiveAt: true,
      createdAt: true,
    },
    take: 2000,
  });

  let neverLoggedIn = 0;
  let inactive3d = 0;
  let inactive7d = 0;
  let inactive14d = 0;
  let inactive30d = 0;
  for (const u of allForIdle) {
    const sessionAt = latestSessionByUser.get(u.id) || null;
    const resolved = resolveLastLogin({
      lastLoginAt: u.lastLoginAt,
      lastActiveAt: u.lastActiveAt,
      sessionStartedAt: sessionAt,
    });
    if (!resolved.at) {
      neverLoggedIn++;
      if (u.createdAt < d3) inactive3d++;
      if (u.createdAt < d7) inactive7d++;
      if (u.createdAt < d14) inactive14d++;
      if (u.createdAt < d30) inactive30d++;
      continue;
    }
    if (resolved.at < d3) inactive3d++;
    if (resolved.at < d7) inactive7d++;
    if (resolved.at < d14) inactive14d++;
    if (resolved.at < d30) inactive30d++;
  }

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
    recentUsers,
    managementUsers,
  };
}
