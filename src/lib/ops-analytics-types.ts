/**
 * Client-safe types for ops analytics (no Prisma).
 */

import type { ServiceId } from "@/lib/services";

export type AnalyticsFilters = {
  days: number;
  role: "ALL" | "AUPAIR" | "PARENT" | "ADMIN" | "AGENCY";
  plan: "ALL" | "FREE" | "PLUS" | "PREMIUM";
  city: string;
  country: string;
  listingStatus: "ALL" | "ACTIVE" | "DRAFT" | "PAUSED";
  verified: "ALL" | "YES" | "NO";
  service: "ALL" | ServiceId;
  suspended: "ALL" | "YES" | "NO";
};

export type AnalyticsResult = {
  filters: AnalyticsFilters;
  generatedAt: string;
  range: { from: string; to: string; days: number };
  kpis: {
    members: number;
    membersInRange: number;
    activeSitters: number;
    activeHosts: number;
    messagesInRange: number;
    interestsInRange: number;
    paymentsInRange: number;
    revenueCentsInRange: number;
    pendingVerify: number;
    openReports: number;
    pendingReviews: number;
    openTickets: number;
  };
  series: {
    dates: string[];
    signups: number[];
    messages: number[];
    payments: number[];
    revenueCents: number[];
    interests: number[];
  };
  breakdowns: {
    byRole: { key: string; count: number }[];
    byPlan: { key: string; count: number }[];
    byCity: { key: string; sitters: number; hosts: number; total: number }[];
    byListingStatus: { key: string; sitters: number; hosts: number }[];
    byService: { key: string; sitters: number; hosts: number }[];
    byCountry: { key: string; count: number }[];
  };
  funnel: { event: string; count: number }[];
  queues: {
    pendingVerify: number;
    pendingReviews: number;
    openReports: number;
    openTickets: number;
    suspended: number;
  };
};
