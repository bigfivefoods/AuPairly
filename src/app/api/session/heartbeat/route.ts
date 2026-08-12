/**
 * Live session presence — browser pings every ~60s while the tab is open.
 * Makes login monitoring accurate without relying only on JWT callbacks.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { heartbeatLoginSession } from "@/lib/login-sessions";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`heartbeat:${session.user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  let sessionId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    sessionId = (body.sessionId as string) || null;
  } catch {
    /* ignore */
  }

  const ua = req.headers.get("user-agent");
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  try {
    const result = await heartbeatLoginSession({
      userId: session.user.id,
      sessionId,
      userAgent: ua,
      ip,
    });
    return NextResponse.json({
      ok: true,
      sessionId: result.sessionId,
      durationSec: result.durationSec,
      t: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[session/heartbeat]", e);
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 });
  }
}
