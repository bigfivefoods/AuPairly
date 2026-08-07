/**
 * AuPairly brand positioning — keep the name, broaden the promise.
 *
 * Covers:
 * - Children (childcare / au pairs)
 * - Elderly / people needing care (caregiving)
 * - Homes (house sitting)
 * - Pets (pet sitting)
 */

export const BRAND = {
  name: "AuPairly",
  domain: "AuPairly.me",
  /** Primary positioning line */
  tagline: "Trusted care for your family, loved ones, home & pets.",
  /** Short variant for tight UI */
  taglineShort: "Family, loved ones, home & pets",
  description:
    "AuPairly.me is the trusted marketplace for childcare, caregiving, house sitting, and pet sitting — verified people, one account, worldwide.",
  ogTitle: "AuPairly — Trusted care for your family, loved ones, home & pets",
  /** What the tagline covers (for marketing copy) */
  covers: ["Children", "Elderly / people needing care", "Homes", "Pets"] as const,
  /** Public contact */
  email: "hello@aupairly.me",
  emailHref: "mailto:hello@aupairly.me",
  whatsapp: "+27 82 581 4215",
  whatsappE164: "27825814215",
  whatsappHref: "https://wa.me/27825814215",
  /**
   * Product glossary — use in UI copy.
   * Internal roles stay AUPAIR / PARENT; user-facing labels are Sitter / Host.
   * “Au pair” is a childcare service type, not the account name.
   */
  roles: {
    sitter: "Sitter",
    host: "Host",
    sitterAlt: "Sitter / care provider",
    hostAlt: "Host / family",
    peerCommunity: "AuPair Connect",
  },
} as const;

/** Map Auth.js / Prisma role to UI label */
export function roleLabel(role?: string | null): string {
  const r = (role || "").toUpperCase();
  if (r === "AUPAIR") return BRAND.roles.sitter;
  if (r === "PARENT") return BRAND.roles.host;
  if (r === "ADMIN") return "Admin";
  return "Member";
}
