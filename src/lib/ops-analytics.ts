/**
 * Management / admin analytics — slice & dice query layer.
 * Server-only (uses Prisma).
 */

import { prisma } from "@/lib/prisma";
import { SERVICE_IDS, type ServiceId } from "@/lib/services";
import type { AnalyticsFilters, AnalyticsResult } from "@/lib/ops-analytics-types";

export type { AnalyticsFilters, AnalyticsResult };

export const DEFAULT_FILTERS: AnalyticsFilters = {
  days: 30,
  role: "ALL",
  plan: "ALL",
  city: "",
  country: "",
  listingStatus: "ALL",
  verified: "ALL",
  service: "ALL",
  suspended: "NO",
};

export function parseAnalyticsFilters(
  sp: URLSearchParams | Record<string, string | undefined>
): AnalyticsFilters {
  const get = (k: string) =>
    sp instanceof URLSearchParams ? sp.get(k) || "" : sp[k] || "";

  const daysRaw = Number(get("days") || 30);
  const days = [7, 14, 30, 60, 90].includes(daysRaw) ? daysRaw : 30;

  const role = (get("role") || "ALL").toUpperCase();
  const plan = (get("plan") || "ALL").toUpperCase();
  const listingStatus = (get("listingStatus") || "ALL").toUpperCase();
  const verified = (get("verified") || "ALL").toUpperCase();
  const suspended = (get("suspended") || "NO").toUpperCase();
  const serviceRaw = (get("service") || "ALL").toUpperCase().replace(/-/g, "_");

  return {
    days,
    role: (["ALL", "AUPAIR", "PARENT", "ADMIN", "AGENCY"].includes(role)
      ? role
      : "ALL") as AnalyticsFilters["role"],
    plan: (["ALL", "FREE", "PLUS", "PREMIUM"].includes(plan)
      ? plan
      : "ALL") as AnalyticsFilters["plan"],
    city: get("city").trim().slice(0, 80),
    country: get("country").trim().slice(0, 80),
    listingStatus: (["ALL", "ACTIVE", "DRAFT", "PAUSED"].includes(listingStatus)
      ? listingStatus
      : "ALL") as AnalyticsFilters["listingStatus"],
    verified: (["ALL", "YES", "NO"].includes(verified)
      ? verified
      : "ALL") as AnalyticsFilters["verified"],
    service: (serviceRaw === "ALL" ||
    SERVICE_IDS.includes(serviceRaw as ServiceId)
      ? serviceRaw
      : "ALL") as AnalyticsFilters["service"],
    suspended: (["ALL", "YES", "NO"].includes(suspended)
      ? suspended
      : "NO") as AnalyticsFilters["suspended"],
  };
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function eachDay(from: Date, to: Date): string[] {
  const out: string[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    out.push(dayKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function userWhere(f: AnalyticsFilters, since?: Date) {
  const where: Record<string, unknown> = {};
  if (since) where.createdAt = { gte: since };
  if (f.role !== "ALL") where.role = f.role;
  if (f.plan !== "ALL") where.plan = f.plan;
  if (f.suspended === "YES") where.suspendedAt = { not: null };
  if (f.suspended === "NO") where.suspendedAt = null;
  return where;
}

function profileWhere(f: AnalyticsFilters, since?: Date) {
  const where: Record<string, unknown> = {};
  if (since) where.createdAt = { gte: since };
  if (f.listingStatus !== "ALL") where.status = f.listingStatus;
  if (f.verified === "YES") where.isVerified = true;
  if (f.verified === "NO") where.isVerified = false;
  if (f.city) where.city = { contains: f.city, mode: "insensitive" };
  if (f.country) where.country = { contains: f.country, mode: "insensitive" };
  if (f.service !== "ALL") where.services = { contains: f.service };
  return where;
}

export async function runOpsAnalytics(
  filters: AnalyticsFilters
): Promise<AnalyticsResult> {
  const to = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (filters.days - 1));

  const dates = eachDay(from, to);
  const uw = userWhere(filters);
  const uwRange = userWhere(filters, from);
  const pw = profileWhere(filters);
  const pwRange = profileWhere(filters, from);

  // Role filter for profiles: when role=AUPAIR only sitter side, etc.
  const wantSitters = filters.role === "ALL" || filters.role === "AUPAIR";
  const wantHosts =
    filters.role === "ALL" ||
    filters.role === "PARENT" ||
    filters.role === "AGENCY";

  const [
    members,
    membersInRange,
    activeSitters,
    activeHosts,
    messagesInRange,
    interestsInRange,
    paymentsAgg,
    pendingVerify,
    openReports,
    pendingReviews,
    openTickets,
    suspended,
    signupUsers,
    messages,
    payments,
    interests,
    byRole,
    byPlan,
    sitterCities,
    hostCities,
    sitterStatus,
    hostStatus,
    sitterCountries,
    hostCountries,
    funnelRows,
  ] = await Promise.all([
    prisma.user.count({ where: uw }),
    prisma.user.count({ where: uwRange }),
    wantSitters
      ? prisma.auPairProfile.count({
          where: profileWhere({ ...filters, listingStatus: "ACTIVE" }),
        })
      : Promise.resolve(0),
    wantHosts
      ? prisma.familyProfile.count({
          where: profileWhere({ ...filters, listingStatus: "ACTIVE" }),
        })
      : Promise.resolve(0),
    prisma.message.count({ where: { createdAt: { gte: from } } }),
    prisma.interest.count({ where: { createdAt: { gte: from } } }),
    prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", paidAt: { gte: from } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.verification.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.review.count({ where: { moderationStatus: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    prisma.user.findMany({
      where: uwRange,
      select: { createdAt: true },
      take: 5000,
    }),
    prisma.message.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
      take: 8000,
    }),
    prisma.paymentTransaction.findMany({
      where: { status: "SUCCESS", paidAt: { gte: from } },
      select: { paidAt: true, amountCents: true },
      take: 5000,
    }),
    prisma.interest.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
      take: 5000,
    }),
    prisma.user.groupBy({
      by: ["role"],
      where: uw,
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      where: uw,
      _count: { _all: true },
    }),
    wantSitters
      ? prisma.auPairProfile.groupBy({
          by: ["city"],
          where: { ...pw, city: { not: null } },
          _count: { id: true },
          orderBy: { _count: { city: "desc" } },
          take: 12,
        })
      : Promise.resolve([]),
    wantHosts
      ? prisma.familyProfile.groupBy({
          by: ["city"],
          where: { ...pw, city: { not: null } },
          _count: { id: true },
          orderBy: { _count: { city: "desc" } },
          take: 12,
        })
      : Promise.resolve([]),
    wantSitters
      ? prisma.auPairProfile.groupBy({
          by: ["status"],
          where: profileWhere({ ...filters, listingStatus: "ALL" }),
          _count: { id: true },
        })
      : Promise.resolve([]),
    wantHosts
      ? prisma.familyProfile.groupBy({
          by: ["status"],
          where: profileWhere({ ...filters, listingStatus: "ALL" }),
          _count: { id: true },
        })
      : Promise.resolve([]),
    wantSitters
      ? prisma.auPairProfile.groupBy({
          by: ["country"],
          where: { ...pw, country: { not: null } },
          _count: { id: true },
          orderBy: { _count: { country: "desc" } },
          take: 10,
        })
      : Promise.resolve([]),
    wantHosts
      ? prisma.familyProfile.groupBy({
          by: ["country"],
          where: { ...pw, country: { not: null } },
          _count: { id: true },
          orderBy: { _count: { country: "desc" } },
          take: 10,
        })
      : Promise.resolve([]),
    prisma.funnelEvent
      .groupBy({
        by: ["event"],
        where: { createdAt: { gte: from } },
        _count: { id: true },
      })
      .catch(() => [] as { event: string; _count: { id: number } }[]),
  ]);

  const bucket = (items: { createdAt?: Date | null; paidAt?: Date | null }[], field: "createdAt" | "paidAt") => {
    const m = new Map<string, number>();
    for (const d of dates) m.set(d, 0);
    for (const it of items) {
      const raw = field === "paidAt" ? it.paidAt : it.createdAt;
      if (!raw) continue;
      const k = dayKey(new Date(raw));
      if (m.has(k)) m.set(k, (m.get(k) || 0) + 1);
    }
    return dates.map((d) => m.get(d) || 0);
  };

  const revBucket = () => {
    const m = new Map<string, number>();
    for (const d of dates) m.set(d, 0);
    for (const p of payments) {
      if (!p.paidAt) continue;
      const k = dayKey(new Date(p.paidAt));
      if (m.has(k)) m.set(k, (m.get(k) || 0) + p.amountCents);
    }
    return dates.map((d) => m.get(d) || 0);
  };

  // City merge
  const cityMap = new Map<string, { sitters: number; hosts: number }>();
  for (const r of sitterCities as { city: string | null; _count: { id: number } }[]) {
    if (!r.city) continue;
    const cur = cityMap.get(r.city) || { sitters: 0, hosts: 0 };
    cur.sitters += r._count.id;
    cityMap.set(r.city, cur);
  }
  for (const r of hostCities as { city: string | null; _count: { id: number } }[]) {
    if (!r.city) continue;
    const cur = cityMap.get(r.city) || { sitters: 0, hosts: 0 };
    cur.hosts += r._count.id;
    cityMap.set(r.city, cur);
  }
  const byCity = [...cityMap.entries()]
    .map(([key, v]) => ({
      key,
      sitters: v.sitters,
      hosts: v.hosts,
      total: v.sitters + v.hosts,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  // Status merge
  const statusKeys = new Set<string>();
  const sStat = new Map<string, number>();
  const hStat = new Map<string, number>();
  for (const r of sitterStatus as { status: string; _count: { id: number } }[]) {
    statusKeys.add(r.status);
    sStat.set(r.status, r._count.id);
  }
  for (const r of hostStatus as { status: string; _count: { id: number } }[]) {
    statusKeys.add(r.status);
    hStat.set(r.status, r._count.id);
  }
  const byListingStatus = [...statusKeys].map((key) => ({
    key,
    sitters: sStat.get(key) || 0,
    hosts: hStat.get(key) || 0,
  }));

  // Country merge
  const countryMap = new Map<string, number>();
  for (const r of sitterCountries as { country: string | null; _count: { id: number } }[]) {
    if (!r.country) continue;
    countryMap.set(r.country, (countryMap.get(r.country) || 0) + r._count.id);
  }
  for (const r of hostCountries as { country: string | null; _count: { id: number } }[]) {
    if (!r.country) continue;
    countryMap.set(r.country, (countryMap.get(r.country) || 0) + r._count.id);
  }
  const byCountry = [...countryMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Service slice counts (JSON contains)
  const byService: { key: string; sitters: number; hosts: number }[] = [];
  for (const svc of SERVICE_IDS) {
    if (filters.service !== "ALL" && filters.service !== svc) continue;
    const [s, h] = await Promise.all([
      wantSitters
        ? prisma.auPairProfile.count({
            where: {
              ...profileWhere({ ...filters, service: svc }),
              services: { contains: svc },
            },
          })
        : 0,
      wantHosts
        ? prisma.familyProfile.count({
            where: {
              ...profileWhere({ ...filters, service: svc }),
              services: { contains: svc },
            },
          })
        : 0,
    ]);
    if (s + h > 0) byService.push({ key: svc, sitters: s, hosts: h });
  }
  byService.sort((a, b) => b.sitters + b.hosts - (a.sitters + a.hosts));

  const funnelOrder = [
    "signup",
    "publish_listing",
    "first_message",
    "shortlist",
    "placement_start",
    "checkout_start",
    "payment_success",
    "invite_copy",
    "house_swap_interest",
  ];
  const funnelMap = new Map(
    (funnelRows as { event: string; _count: { id: number } }[]).map((r) => [
      r.event,
      r._count.id,
    ])
  );
  const funnel = funnelOrder.map((event) => ({
    event,
    count: funnelMap.get(event) || 0,
  }));

  return {
    filters,
    generatedAt: new Date().toISOString(),
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      days: filters.days,
    },
    kpis: {
      members,
      membersInRange,
      activeSitters,
      activeHosts,
      messagesInRange,
      interestsInRange,
      paymentsInRange: paymentsAgg._count,
      revenueCentsInRange: paymentsAgg._sum.amountCents || 0,
      pendingVerify,
      openReports,
      pendingReviews,
      openTickets,
    },
    series: {
      dates,
      signups: bucket(signupUsers, "createdAt"),
      messages: bucket(messages, "createdAt"),
      payments: bucket(payments, "paidAt"),
      revenueCents: revBucket(),
      interests: bucket(interests, "createdAt"),
    },
    breakdowns: {
      byRole: byRole.map((r) => ({
        key: r.role,
        count: r._count._all,
      })),
      byPlan: byPlan.map((p) => ({
        key: p.plan || "FREE",
        count: p._count._all,
      })),
      byCity,
      byListingStatus,
      byService,
      byCountry,
    },
    funnel,
    queues: {
      pendingVerify,
      pendingReviews,
      openReports,
      openTickets,
      suspended,
    },
  };
}
