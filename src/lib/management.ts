/**
 * Owner / management console access.
 * ADMIN role always allowed; owner emails listed below always allowed
 * (even if still PARENT/AUPAIR in the DB).
 */

const OWNER_EMAILS = new Set(
  [
    "craig@bigfivegroup.africa",
    // Optional override: comma-separated MANAGEMENT_EMAILS=a@x.com,b@y.com
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

export const MANAGEMENT_OWNER_EMAIL = "craig@bigfivegroup.africa";
