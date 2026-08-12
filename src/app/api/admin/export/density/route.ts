import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessManagement } from "@/lib/management";
import {
  densityTargetsCsv,
  getDensityTargets,
} from "@/lib/city-density-ops";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canAccessManagement(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { targets } = await getDensityTargets(50);
    const csv = densityTargetsCsv(targets);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aupairly-city-density.csv"`,
      },
    });
  } catch (e) {
    console.error("[export/density]", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
