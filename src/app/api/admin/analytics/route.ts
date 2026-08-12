/**
 * GET /api/admin/analytics
 * Slice & dice ops metrics. Management / admin only.
 *
 * Query: days, role, plan, city, country, listingStatus, verified, service, suspended
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessManagement } from "@/lib/management";
import {
  parseAnalyticsFilters,
  runOpsAnalytics,
} from "@/lib/ops-analytics";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !canAccessManagement(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = rateLimit(`ops-analytics:${session.user.id}`, {
    limit: 40,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const url = new URL(req.url);
    const filters = parseAnalyticsFilters(url.searchParams);
    const data = await runOpsAnalytics(filters);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[admin/analytics]", e);
    return NextResponse.json(
      { error: "Analytics query failed" },
      { status: 500 }
    );
  }
}
