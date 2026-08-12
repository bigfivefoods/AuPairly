/**
 * Owner / management console access.
 * ADMIN role always allowed; owner emails listed below always allowed
 * (even if still PARENT/AUPAIR in the DB).
 */

/**
 * Hard-coded ops team (always included).
 * Management console access + ops emails (signups, daily digest, verifications,
 * reviews, reports, support, payments) for every address below.
 * Must register / sign in with the exact email.
 */
const HARDCODED_MANAGEMENT_EMAILS = [
  "craig@bigfivegroup.africa",
  "ryleerkendall@icloud.com",
  "nicola@kencrete.co.za",
  "clint@kencrete.co.za",
  "b.west.pot@gmail.com",
] as const;

const OWNER_EMAILS = new Set(
  [
    ...HARDCODED_MANAGEMENT_EMAILS,
    // Optional extra recipients: MANAGEMENT_EMAILS=a@x.com,b@y.com on Vercel
    ...(process.env.MANAGEMENT_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ].map((e) => e.toLowerCase())
);

export function isManagementEmail(email?: string | null): boolean {
  if (!email) return false;
  return OWNER_EMAILS.has(email.toLowerCase().trim());
}

export function canAccessManagement(user?: {
  email?: string | null;
  role?: string | null;
} | null): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return isManagementEmail(user.email);
}

/** All owner/ops emails for automated digests & alerts */
export function getManagementEmails(): string[] {
  return Array.from(OWNER_EMAILS);
}

export const MANAGEMENT_OWNER_EMAIL = "craig@bigfivegroup.africa";
