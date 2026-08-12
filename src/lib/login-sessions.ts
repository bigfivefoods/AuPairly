/**
 * Login / session tracking for management monitoring + re-engagement.
 * Server-only — accurate, live presence via /api/session/heartbeat.
 */

import { prisma } from "@/lib/prisma";
import {
  formatDuration,
  type LoginMonitoringStats,
} from "@/lib/login-monitor-types";

export { formatDuration };
export type { LoginMonitoringStats };

/** Heartbeat interval expected from client (~60s); allow lag */
export const HEARTBEAT_CLIENT_MS = 60_000;
/** Consider open session abandoned after no heartbeat */
export const SESSION_STALE_MS = 2 * 60 * 60 * 1000; // 2 hours
/** “Active now” = open session seen within this window */
export const ACTIVE_NOW_MS = 3 * 60 * 1000; // 3 minutes

export async function startLoginSession(opts: {
  userId: string;
  userAgent?: string | null;
  ip?: string | null;
  /** true = password sign-in (increments loginCount) */
  isPasswordLogin?: boolean;
}): Promise<string | null> {
  try {
    const now = new Date();
    await closeOpenSessions(opts.userId, now);

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
        ...(opts.isPasswordLogin !== false
          ? { loginCount: { increment: 1 } }
          : {}),
      },
    });

    return session.id;
  } catch (e) {
    console.error("[login-sessions] start failed", e);
    return null;
  }
}

async function closeOpenSessions(userId: string, now: Date) {
  const open = await prisma.loginSession.findMany({
    where: { userId, endedAt: null },
    take: 20,
  });
  for (const s of open) {
    const end = maxDate(s.lastSeenAt, now) || now;
    const sec = Math.max(
      0,
      Math.round((end.getTime() - s.startedAt.getTime()) / 1000)
    );
    await prisma.loginSession
      .update({
        where: { id: s.id },
        data: { endedAt: end, lastSeenAt: end, durationSec: sec },
      })
      .catch(() => null);
  }
}

/**
 * Live presence ping — call from browser every ~60s while logged in.
 * Creates a session if JWT user has none (returning cookie session).
 */
export async function heartbeatLoginSession(opts: {
  userId: string;
  sessionId?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ sessionId: string; durationSec: number }> {
  const now = new Date();

  // Close abandoned sessions for this user (no ping for 2h)
  const staleBefore = new Date(now.getTime() - SESSION_STALE_MS);
  const abandoned = await prisma.loginSession.findMany({
    where: {
      userId: opts.userId,
      endedAt: null,
      lastSeenAt: { lt: staleBefore },
    },
    take: 10,
  });
  for (const s of abandoned) {
    const sec = Math.max(
      0,
      Math.round((s.lastSeenAt.getTime() - s.startedAt.getTime()) / 1000)
    );
    await prisma.loginSession
      .update({
        where: { id: s.id },
        data: {
          endedAt: s.lastSeenAt,
          durationSec: sec,
        },
      })
      .catch(() => null);
  }

  let session =
    opts.sessionId
      ? await prisma.loginSession.findUnique({ where: { id: opts.sessionId } })
      : null;

  if (!session || session.userId !== opts.userId || session.endedAt) {
    session = await prisma.loginSession.findFirst({
      where: { userId: opts.userId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
  }

  if (!session) {
    // Returning JWT user with no open session — start presence session (not a new password login)
    const id = await startLoginSession({
      userId: opts.userId,
      userAgent: opts.userAgent,
      ip: opts.ip,
      isPasswordLogin: false,
    });
    // startLoginSession increments loginCount only if isPasswordLogin !== false
    // Wait I set isPasswordLogin: false but startLoginSession does:
    // ...(opts.isPasswordLogin !== false ? { loginCount: { increment: 1 } } : {}),
    // so false means no increment. Good.
    // But startLoginSession still sets lastLoginAt = now which is correct for "last seen on site"
    // Actually for presence-only we should NOT bump lastLoginAt as a "login" - but for idle reengage,
    // last activity IS what we want. Keep lastLoginAt updated as last presence for reengage accuracy.
    // For display we'll show lastLoginAt as "last seen" when source is activity/session.

    // Fix startLoginSession with isPasswordLogin false - it still sets lastLoginAt. Good for reengage.
    // loginCount not incremented. Good.

    if (!id) {
      return { sessionId: "", durationSec: 0 };
    }
    return { sessionId: id, durationSec: 0 };
  }

  await prisma.loginSession.update({
    where: { id: session.id },
    data: {
      lastSeenAt: now,
      ...(opts.userAgent
        ? { userAgent: opts.userAgent.slice(0, 240) }
        : {}),
    },
  });

  await prisma.user.update({
    where: { id: opts.userId },
    data: {
      lastActiveAt: now,
      // Keep lastLoginAt as most recent presence if older than session start
    },
  });
  await prisma.user
    .updateMany({
      where: {
        id: opts.userId,
        OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: session.startedAt } }],
      },
      data: { lastLoginAt: session.startedAt },
    })
    .catch(() => null);

  const durationSec = Math.max(
    0,
    Math.round((now.getTime() - session.startedAt.getTime()) / 1000)
  );
  return { sessionId: session.id, durationSec };
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
      await closeOpenSessions(opts.userId, now);
    }
  } catch (e) {
    console.error("[login-sessions] end failed", e);
  }
}

/** Close all globally stale open sessions (cron or stats load) */
export async function closeStaleSessionsGlobally() {
  const cutoff = new Date(Date.now() - SESSION_STALE_MS);
  const stale = await prisma.loginSession.findMany({
    where: { endedAt: null, lastSeenAt: { lt: cutoff } },
    take: 200,
  });
  for (const s of stale) {
    const sec = Math.max(
      0,
      Math.round((s.lastSeenAt.getTime() - s.startedAt.getTime()) / 1000)
    );
    await prisma.loginSession
      .update({
        where: { id: s.id },
        data: { endedAt: s.lastSeenAt, durationSec: sec },
      })
      .catch(() => null);
  }
  return stale.length;
}

export function sessionDurationSec(
  s: {
    startedAt: Date;
    lastSeenAt: Date;
    endedAt?: Date | null;
    durationSec?: number | null;
  },
  nowMs = Date.now()
): number {
  if (s.endedAt && s.durationSec != null) return s.durationSec;
  if (s.endedAt) {
    return Math.max(
      0,
      Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 1000)
    );
  }
  // Open session: live duration to now (or lastSeen if fresher logic)
  const end = Math.max(s.lastSeenAt.getTime(), nowMs);
  // If lastSeen is recent, use now for live ticking; if stale, use lastSeen
  const useEnd =
    nowMs - s.lastSeenAt.getTime() < ACTIVE_NOW_MS ? nowMs : s.lastSeenAt.getTime();
  return Math.max(0, Math.round((useEnd - s.startedAt.getTime()) / 1000));
}

function maxDate(...dates: (Date | null | undefined)[]): Date | null {
  let best: Date | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (!best || d.getTime() > best.getTime()) best = d;
  }
  return best;
}

/**
 * Effective last presence for idle / re-engage.
 * Prefer lastLoginAt, then latest session start, then lastActiveAt.
 */
function resolveLastLogin(opts: {
  lastLoginAt?: Date | null;
  lastActiveAt?: Date | null;
  sessionStartedAt?: Date | null;
  sessionLastSeen?: Date | null;
}): { at: Date | null; source: "login" | "session" | "activity" | "none" } {
  // Most recent of all signals
  const login = opts.lastLoginAt || null;
  const sessionSeen = opts.sessionLastSeen || opts.sessionStartedAt || null;
  const activity = opts.lastActiveAt || null;

  const best = maxDate(login, sessionSeen, activity);
  if (!best) return { at: null, source: "none" };

  if (login && best.getTime() === login.getTime())
    return { at: login, source: "login" };
  if (sessionSeen && best.getTime() === sessionSeen.getTime())
    return { at: sessionSeen, source: "session" };
  if (activity && best.getTime() === activity.getTime())
    return { at: activity, source: "activity" };
  return { at: best, source: "activity" };
}

export async function getLoginMonitoringStats(opts?: {
  recentLimit?: number;
}): Promise<LoginMonitoringStats> {
  const { getManagementEmails, isManagementEmail } = await import(
    "@/lib/management"
  );
  const mgmtEmails = getManagementEmails().map((e) => e.toLowerCase());

  // Keep data clean before reading
  await closeStaleSessionsGlobally().catch(() => 0);

  const limit = opts?.recentLimit ?? 40;
  const now = Date.now();
  const generatedAt = new Date().toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const week = new Date(now - 7 * 86400000);
  const month = new Date(now - 30 * 86400000);
  const activeCutoff = new Date(now - ACTIVE_NOW_MS);
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
      take: 3000,
    }),
    prisma.loginSession.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
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
      orderBy: [
        { lastActiveAt: "desc" },
        { lastLoginAt: "desc" },
        { createdAt: "desc" },
      ],
      take: Math.max(limit * 2, 80),
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
    prisma.user.findMany({
      where: { email: { in: mgmtEmails, mode: "insensitive" } },
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
    prisma.loginSession.findMany({
      orderBy: { lastSeenAt: "desc" },
      take: 800,
      select: {
        userId: true,
        startedAt: true,
        lastSeenAt: true,
        endedAt: true,
      },
    }),
  ]);

  // Latest session signal per user (prefer open, else most recent lastSeen)
  const latestSessionByUser = new Map<
    string,
    { startedAt: Date; lastSeenAt: Date; open: boolean }
  >();
  for (const s of latestSessions) {
    const cur = latestSessionByUser.get(s.userId);
    if (!cur) {
      latestSessionByUser.set(s.userId, {
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        open: !s.endedAt,
      });
      continue;
    }
    // Prefer open session; else newer lastSeen
    if (!s.endedAt && cur.open === false) {
      latestSessionByUser.set(s.userId, {
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        open: true,
      });
    } else if (
      s.lastSeenAt.getTime() > cur.lastSeenAt.getTime() &&
      !(cur.open && s.endedAt)
    ) {
      latestSessionByUser.set(s.userId, {
        startedAt: s.startedAt,
        lastSeenAt: s.lastSeenAt,
        open: !s.endedAt,
      });
    }
  }

  // Sync backfill lastLoginAt from best signal
  for (const u of [...memberUsers, ...managementDbUsers].slice(0, 100)) {
    if (u.lastLoginAt && u.lastActiveAt) continue;
    const sess = latestSessionByUser.get(u.id);
    const derived = maxDate(
      u.lastLoginAt,
      sess?.lastSeenAt,
      sess?.startedAt,
      u.lastActiveAt
    );
    if (!derived) continue;
    if (!u.lastLoginAt || derived.getTime() > u.lastLoginAt.getTime()) {
      void prisma.user
        .update({
          where: { id: u.id },
          data: {
            lastLoginAt: derived,
            ...(u.lastActiveAt ? {} : { lastActiveAt: derived }),
          },
        })
        .catch(() => null);
    }
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
    const sess = latestSessionByUser.get(u.id);
    const resolved = resolveLastLogin({
      lastLoginAt: u.lastLoginAt,
      lastActiveAt: u.lastActiveAt,
      sessionStartedAt: sess?.startedAt,
      sessionLastSeen: sess?.lastSeenAt,
    });
    const daysSinceLogin = resolved.at
      ? Math.floor((now - resolved.at.getTime()) / 86400000)
      : null;
    const isOnline =
      !!sess?.open &&
      now - sess.lastSeenAt.getTime() < ACTIVE_NOW_MS;

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
      isOnline,
      openSessionDurationSec: sess?.open
        ? sessionDurationSec(
            {
              startedAt: sess.startedAt,
              lastSeenAt: sess.lastSeenAt,
              endedAt: null,
            },
            now
          )
        : null,
    };
  }

  const managementByEmail = new Map(
    managementDbUsers.map((u) => [u.email.toLowerCase(), u])
  );

  const managementUsers: LoginMonitoringStats["managementUsers"] =
    mgmtEmails.map((email) => {
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
          isOnline: false,
          openSessionDurationSec: null,
        };
      }
      const mapped = mapUserRow(u);
      return {
        ...mapped,
        id: u.id,
        isManagement: true as const,
        registered: true,
      };
    });

  const byId = new Map<string, ReturnType<typeof mapUserRow>>();
  for (const u of memberUsers) byId.set(u.id, mapUserRow(u));
  for (const u of managementDbUsers) byId.set(u.id, mapUserRow(u));

  const recentUsers = [...byId.values()]
    .sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if (a.isManagement !== b.isManagement) return a.isManagement ? -1 : 1;
      const ta = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
      const tb = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, limit + mgmtEmails.length);

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
    take: 3000,
  });

  let neverLoggedIn = 0;
  let inactive3d = 0;
  let inactive7d = 0;
  let inactive14d = 0;
  let inactive30d = 0;
  for (const u of allForIdle) {
    const sess = latestSessionByUser.get(u.id);
    const resolved = resolveLastLogin({
      lastLoginAt: u.lastLoginAt,
      lastActiveAt: u.lastActiveAt,
      sessionStartedAt: sess?.startedAt,
      sessionLastSeen: sess?.lastSeenAt,
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
    .map((s) => sessionDurationSec(s, now))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const avgSessionSecWeek = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const medianSessionSecWeek = durations.length
    ? durations[Math.floor(durations.length / 2)]
    : 0;

  return {
    generatedAt,
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
      const durationSec = sessionDurationSec(s, now);
      const open = !s.endedAt;
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
        open,
        isOnline:
          open && now - s.lastSeenAt.getTime() < ACTIVE_NOW_MS,
      };
    }),
    recentUsers,
    managementUsers,
  };
}
