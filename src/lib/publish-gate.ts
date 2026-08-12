/**
 * Server helper: load user+profile and decide if ACTIVE publish is allowed.
 */

import { prisma } from "@/lib/prisma";
import { canPublishActive } from "@/lib/gates";
import type { CompletenessInput } from "@/lib/completeness";

export async function publishGateForUser(
  userId: string,
  role: string,
  draft: {
    headline?: string | null;
    bio?: string | null;
    city?: string | null;
    country?: string | null;
    languages?: string | null;
    services?: string | null;
    status?: string | null;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
      videoIntroUrl: true,
      role: true,
    },
  });

  const input: CompletenessInput = {
    role: role || user?.role || "AUPAIR",
    name: user?.name,
    image: user?.image,
    videoIntroUrl: user?.videoIntroUrl,
    headline: draft.headline,
    bio: draft.bio,
    city: draft.city,
    country: draft.country,
    languages: draft.languages,
    services: draft.services,
    status: draft.status || "DRAFT",
  };

  return canPublishActive(input);
}
