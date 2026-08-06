import "server-only";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { parseServices, type ServiceId } from "@/lib/services";

type TagDelegate = {
  deleteMany: (args: {
    where: { profileRole: string; profileId: string };
  }) => Promise<unknown>;
  createMany: (args: {
    data: { profileRole: string; profileId: string; serviceId: string }[];
    skipDuplicates?: boolean;
  }) => Promise<unknown>;
  findMany: (args: {
    where: { profileRole: string; serviceId: string };
    select: { profileId: true };
  }) => Promise<{ profileId: string }[]>;
};

/** Safe access — never throw if DB env missing, client mid-regenerate, or model missing. */
function tagDelegate(): TagDelegate | null {
  if (!isDatabaseConfigured()) return null;
  try {
    const d = (prisma as unknown as { profileServiceTag?: TagDelegate })
      .profileServiceTag;
    if (!d || typeof d.findMany !== "function") return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Keep ProfileServiceTag rows in sync with profile.services JSON.
 * Enables reliable category filtering on Supabase.
 */
export async function syncProfileServiceTags(opts: {
  profileRole: "AUPAIR" | "FAMILY";
  profileId: string;
  servicesJson: string | ServiceId[] | null | undefined;
}) {
  const tags = tagDelegate();
  if (!tags) {
    console.warn("[service-tags] profileServiceTag unavailable; skip sync");
    return;
  }

  const services = Array.isArray(opts.servicesJson)
    ? opts.servicesJson
    : parseServices(
        typeof opts.servicesJson === "string" ? opts.servicesJson : null
      );

  try {
    await tags.deleteMany({
      where: {
        profileRole: opts.profileRole,
        profileId: opts.profileId,
      },
    });

    if (services.length === 0) return;

    await tags.createMany({
      data: services.map((serviceId) => ({
        profileRole: opts.profileRole,
        profileId: opts.profileId,
        serviceId,
      })),
      skipDuplicates: true,
    });
  } catch (e) {
    console.error("[service-tags] sync failed", e);
  }
}

/**
 * Profile IDs tagged with a service (normalized filter).
 * Returns [] if the tag table/client is unavailable — callers fall back to
 * filtering profile.services JSON.
 */
export async function profileIdsForService(
  profileRole: "AUPAIR" | "FAMILY",
  serviceId: ServiceId
): Promise<string[]> {
  const tags = tagDelegate();
  if (!tags) return [];

  try {
    const rows = await tags.findMany({
      where: { profileRole, serviceId },
      select: { profileId: true },
    });
    return rows.map((r) => r.profileId);
  } catch (e) {
    console.error("[service-tags] profileIdsForService failed", e);
    return [];
  }
}
