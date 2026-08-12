/**
 * Client-safe login monitoring types + duration helpers (no Prisma).
 */

export function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 48) return rm ? `${h}h ${rm}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export type LoginUserRow = {
  id: string | null;
  name: string;
  email: string;
  role: string | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  loginCount: number;
  daysSinceLogin: number | null;
  isManagement: boolean;
  lastLoginSource: "login" | "session" | "activity" | "none";
  isOnline?: boolean;
  openSessionDurationSec?: number | null;
  registered?: boolean;
};

export type LoginMonitoringStats = {
  /** ISO timestamp when this snapshot was computed */
  generatedAt: string;
  loginsToday: number;
  loginsWeek: number;
  loginsMonth: number;
  uniqueLoginsToday: number;
  uniqueLoginsWeek: number;
  activeNow: number;
  avgSessionSecWeek: number;
  medianSessionSecWeek: number;
  neverLoggedIn: number;
  inactive3d: number;
  inactive7d: number;
  inactive14d: number;
  inactive30d: number;
  recentSessions: {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    startedAt: string;
    lastSeenAt: string;
    endedAt: string | null;
    durationSec: number;
    durationLabel: string;
    open: boolean;
    isOnline?: boolean;
  }[];
  recentUsers: LoginUserRow[];
  managementUsers: (LoginUserRow & {
    isManagement: true;
    registered: boolean;
  })[];
};
