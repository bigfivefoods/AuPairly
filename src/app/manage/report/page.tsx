import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { canAccessManagement } from "@/lib/management";
import {
  DEFAULT_FILTERS,
  parseAnalyticsFilters,
  runOpsAnalytics,
} from "@/lib/ops-analytics";
import { ManageReportA4 } from "@/components/manage-report-a4";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Management report (A4)",
  description: "One-page A4 landscape management report for AuPairly ops.",
  path: "/manage/report",
  noIndex: true,
});

export default async function ManageReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await requireUser();
  if (!canAccessManagement(user)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const daysRaw = Number(sp.days || 30);
  const days = [7, 14, 30, 60, 90].includes(daysRaw) ? daysRaw : 30;

  const filters = parseAnalyticsFilters({
    days: String(days),
    role: DEFAULT_FILTERS.role,
    plan: DEFAULT_FILTERS.plan,
    city: "",
    country: "",
    listingStatus: DEFAULT_FILTERS.listingStatus,
    verified: DEFAULT_FILTERS.verified,
    service: DEFAULT_FILTERS.service,
    suspended: "NO",
  });

  const data = await runOpsAnalytics(filters);

  return (
    <ManageReportA4
      data={data}
      preparedBy={user.email || user.name || "Management"}
      days={days}
    />
  );
}
