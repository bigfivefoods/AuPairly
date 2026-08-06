/**
 * Authenticated preview of "this week's matches" (same engine as digest).
 * GET /api/matches/preview
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTopMatchesForUser } from "@/lib/match-digest";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await getTopMatchesForUser(session.user.id, 5);
  return NextResponse.json({ matches });
}
