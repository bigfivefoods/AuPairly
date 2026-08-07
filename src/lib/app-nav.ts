/**
 * Shared app navigation for the authenticated shell (side + mobile).
 */

export type AppNavItem = {
  href: string;
  label: string;
  /** path prefixes that mark this item active */
  match?: string[];
  /** show only for these roles (omit = everyone logged in) */
  roles?: Array<"AUPAIR" | "PARENT" | "ADMIN" | "AGENCY">;
  badge?: "admin";
};

export type AppNavGroup = {
  id: string;
  label: string;
  items: AppNavItem[];
};

export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    id: "home",
    label: "Home",
    items: [
      { href: "/dashboard", label: "Dashboard", match: ["/dashboard"] },
      { href: "/discover", label: "Discover", match: ["/discover"] },
      {
        href: "/browse/aupairs",
        label: "Sitters",
        match: ["/browse/aupairs"],
      },
      {
        href: "/browse/families",
        label: "Hosts",
        match: ["/browse/families"],
      },
      { href: "/messages", label: "Messages", match: ["/messages"] },
      {
        href: "/interests",
        label: "Interests",
        match: ["/interests", "/shortlist", "/matches"],
      },
      {
        href: "/community",
        label: "AuPair Connect",
        match: ["/community"],
        roles: ["AUPAIR"],
      },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    items: [
      {
        href: "/profile/edit",
        label: "Profile & listing",
        match: ["/profile"],
      },
      {
        href: "/availability",
        label: "Availability",
        match: ["/availability"],
        roles: ["AUPAIR"],
      },
      {
        href: "/documents",
        label: "Document vault",
        match: ["/documents"],
      },
      {
        href: "/verification",
        label: "Verification",
        match: ["/verification", "/trust", "/references"],
      },
      {
        href: "/applications",
        label: "Applications",
        match: ["/applications"],
      },
      {
        href: "/placements",
        label: "Placements",
        match: ["/placements"],
      },
      {
        href: "/reviews",
        label: "Reviews",
        match: ["/reviews"],
      },
      {
        href: "/billing",
        label: "Billing",
        match: ["/billing", "/boost", "/pricing"],
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { href: "/account", label: "Account", match: ["/account"] },
      {
        href: "/settings/connections",
        label: "Connections",
        match: ["/settings/connections"],
      },
      {
        href: "/settings/notifications",
        label: "Notifications",
        match: ["/settings/notifications"],
      },
      { href: "/support", label: "Support", match: ["/support"] },
      {
        href: "/manage",
        label: "Management",
        match: ["/manage"],
        roles: ["ADMIN"],
        badge: "admin",
      },
      {
        href: "/admin",
        label: "Admin",
        match: ["/admin"],
        roles: ["ADMIN"],
        badge: "admin",
      },
    ],
  },
];

export function navItemVisible(
  item: AppNavItem,
  role?: string | null,
  email?: string | null
): boolean {
  // Owner management console: always show manage/admin for allowlisted emails
  if (
    (item.href === "/manage" || item.href === "/admin") &&
    email &&
    email.toLowerCase() === "craig@bigfivegroup.africa"
  ) {
    return true;
  }
  if (!item.roles?.length) return true;
  const r = (role || "").toUpperCase();
  return item.roles.some((allowed) => allowed === r);
}

export function isNavActive(path: string, item: AppNavItem): boolean {
  const matches = item.match?.length ? item.match : [item.href];
  return matches.some((m) => path === m || path.startsWith(m + "/"));
}

/** Auth routes that keep the public chrome (no app shell) */
export function isAuthPath(path: string): boolean {
  return (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  );
}
