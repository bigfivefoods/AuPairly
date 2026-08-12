/**
 * Live login monitoring JSON for management UI auto-refresh.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessManagement } from "@/lib/management";
import { getLoginMonitoringStats } from "@/lib/login-sessions";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessManagement(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stats = await getLoginMonitoringStats({ recentLimit: 40 });
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("[admin/login-stats]", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
