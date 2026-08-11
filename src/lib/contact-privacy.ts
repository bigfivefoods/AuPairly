/**
 * Airbnb-style contact privacy: no phone / email / social handles in chat
 * until the relationship reaches the shortlist (or later) stage.
 */

import { prisma } from "@/lib/prisma";

/** Patterns that look like off-platform contact sharing */
const CONTACT_PATTERNS: RegExp[] = [
  /whatsapp/i,
  /telegram/i,
  /\bsignal\b/i,
  /\b\+?\d[\d\s\-()]{8,}\d\b/,
  /\b0\d{9}\b/,
  /@gmail\.com/i,
  /@yahoo\./i,
  /@icloud\./i,
  /@outlook\./i,
  /@hotmail\./i,
  /\bcall me\b/i,
  /\btext me\b/i,
  /\bmy number\b/i,
  /\bphone(?:\s+number)?\b/i,
  /meet me at my (?:house|home|flat|apartment)/i,
  /send me your address/i,
];

export function messageContainsContact(body: string): boolean {
  const t = body.trim();
  if (!t) return false;
  return CONTACT_PATTERNS.some((p) => p.test(t));
}

/**
 * Contact details may be shared only after shortlisting (either side),
 * accepted interest, peer connect accepted, or placement interview+.
 */
export async function canShareContact(
  userId: string,
  otherId: string
): Promise<{ allowed: boolean; reason: string }> {
  if (userId === otherId) {
    return { allowed: false, reason: "self" };
  }

  const [shortlistEither, interestAccepted, peerAccepted, placement] =
    await Promise.all([
      prisma.shortlistItem.findFirst({
        where: {
          OR: [
            { userId, targetUserId: otherId },
            { userId: otherId, targetUserId: userId },
          ],
        },
        select: { id: true },
      }),
      prisma.interest.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { fromUserId: userId, toUserId: otherId },
            { fromUserId: otherId, toUserId: userId },
          ],
        },
        select: { id: true },
      }),
      prisma.peerConnect.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { fromUserId: userId, toUserId: otherId },
            { fromUserId: otherId, toUserId: userId },
          ],
        },
        select: { id: true },
      }),
      prisma.placement.findFirst({
        where: {
          OR: [
            { parentUserId: userId, aupairUserId: otherId },
            { parentUserId: otherId, aupairUserId: userId },
          ],
          status: {
            in: ["INTERVIEW", "TRIAL", "PLACED", "COMPLETED"],
          },
        },
        select: { id: true },
      }),
    ]);

  if (shortlistEither) {
    return { allowed: true, reason: "shortlist" };
  }
  if (interestAccepted) {
    return { allowed: true, reason: "interest_accepted" };
  }
  if (peerAccepted) {
    return { allowed: true, reason: "peer_accepted" };
  }
  if (placement) {
    return { allowed: true, reason: "placement" };
  }

  return {
    allowed: false,
    reason: "not_shortlisted",
  };
}

export const CONTACT_BLOCK_MESSAGE =
  "Phone numbers, emails, and social handles stay private until someone shortlists the other (next stage). Keep chatting on AuPairly for now.";
