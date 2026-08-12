/**
 * Notify members when a new listing appears in their city (network effects).
 */

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

const site = () =>
  (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "https://www.aupairly.me"
  ).replace(/\/$/, "");

/**
 * Call after a profile is published ACTIVE with a city.
 * Emails/in-app notifies users in the same city (opposite role preferred).
 */
export async function notifyCityOfNewListing(opts: {
  city: string;
  country?: string | null;
  rolePublished: "AUPAIR" | "PARENT";
  publisherUserId: string;
  publisherName: string;
}) {
  const city = opts.city.trim();
  if (!city) return { notified: 0 };

  // Cap early liquidity pings — only when city still thin
  const [sitterCount, hostCount] = await Promise.all([
    prisma.auPairProfile.count({
      where: {
        status: "ACTIVE",
        city: { contains: city, mode: "insensitive" },
      },
    }),
    prisma.familyProfile.count({
      where: {
        status: "ACTIVE",
        city: { contains: city, mode: "insensitive" },
      },
    }),
  ]);
  const total = sitterCount + hostCount;
  if (total > 12) return { notified: 0 }; // dense enough

  // Notify opposite role in same city
  const wantRole = opts.rolePublished === "AUPAIR" ? "PARENT" : "AUPAIR";
  const users =
    wantRole === "PARENT"
      ? await prisma.user.findMany({
          where: {
            role: "PARENT",
            id: { not: opts.publisherUserId },
            suspendedAt: null,
            familyProfile: {
              city: { contains: city, mode: "insensitive" },
            },
            emailPrefMessages: { not: "OFF" },
          },
          select: { id: true, email: true, name: true, emailPrefMessages: true },
          take: 40,
        })
      : await prisma.user.findMany({
          where: {
            role: "AUPAIR",
            id: { not: opts.publisherUserId },
            suspendedAt: null,
            aupairProfile: {
              city: { contains: city, mode: "insensitive" },
            },
            emailPrefMessages: { not: "OFF" },
          },
          select: { id: true, email: true, name: true, emailPrefMessages: true },
          take: 40,
        });

  const href =
    opts.rolePublished === "AUPAIR"
      ? `/browse/aupairs?city=${encodeURIComponent(city)}`
      : `/browse/families?city=${encodeURIComponent(city)}`;
  const kind = opts.rolePublished === "AUPAIR" ? "sitter" : "host";
  let notified = 0;

  for (const u of users) {
    // Throttle: one city alert per user per 3 days
    const recent = await prisma.notification.findFirst({
      where: {
        userId: u.id,
        title: { startsWith: "New in " },
        createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) continue;

    await createNotification({
      userId: u.id,
      type: "SYSTEM",
      title: `New in ${city}`,
      body: `${opts.publisherName.split(" ")[0]} listed as a ${kind} near you. Open browse to connect.`,
      href,
    }).catch(() => null);

    if (u.email && u.emailPrefMessages !== "OFF") {
      const first = (u.name || "there").split(" ")[0];
      const url = `${site()}${href}`;
      void sendEmail({
        to: u.email,
        subject: `New ${kind} in ${city} on AuPairly`,
        text: `Hi ${first},\n\nSomeone just listed as a ${kind} in ${city}. Your city is still growing — connect early for better matches.\n\n${url}\n`,
        html: `<p>Hi ${first},</p><p>Someone just listed as a <strong>${kind}</strong> in <strong>${city}</strong>. Connect early while the city is growing.</p><p><a href="${url}">Browse ${city}</a></p>`,
      }).catch(() => null);
    }
    notified++;
  }

  return { notified };
}

/** Cities with demand signals (saved searches / profiles) but very few listings */
export async function getGhostTownCities(limit = 15) {
  const [sitters, hosts, searches] = await Promise.all([
    prisma.auPairProfile.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
      _count: { id: true },
    }),
    prisma.familyProfile.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
      _count: { id: true },
    }),
    prisma.savedSearch.findMany({
      where: { alertEnabled: true },
      select: { filters: true, name: true },
      take: 200,
    }),
  ]);

  const supply = new Map<string, { sitters: number; hosts: number }>();
  for (const s of sitters) {
    if (!s.city) continue;
    const k = s.city.trim();
    const cur = supply.get(k) || { sitters: 0, hosts: 0 };
    cur.sitters += s._count.id;
    supply.set(k, cur);
  }
  for (const h of hosts) {
    if (!h.city) continue;
    const k = h.city.trim();
    const cur = supply.get(k) || { sitters: 0, hosts: 0 };
    cur.hosts += h._count.id;
    supply.set(k, cur);
  }

  const demand = new Map<string, number>();
  for (const s of searches) {
    try {
      const f = JSON.parse(s.filters || "{}") as { city?: string };
      if (f.city?.trim()) {
        const k = f.city.trim();
        demand.set(k, (demand.get(k) || 0) + 1);
      }
    } catch {
      /* ignore */
    }
  }

  const cities = new Set([...supply.keys(), ...demand.keys()]);
  const rows = [...cities]
    .map((city) => {
      const sup = supply.get(city) || { sitters: 0, hosts: 0 };
      const total = sup.sitters + sup.hosts;
      const want = demand.get(city) || 0;
      const score = want * 10 - total; // high demand, low supply
      return {
        city,
        sitters: sup.sitters,
        hosts: sup.hosts,
        total,
        savedSearchHits: want,
        thin: total < 5,
        score,
      };
    })
    .filter((r) => r.thin || r.savedSearchHits > 0)
    .sort((a, b) => b.score - a.score || a.total - b.total)
    .slice(0, limit);

  return rows;
}
