/**
 * Daily re-engagement: notify members based on last login idle days (3/7/14/30).
 * Vercel cron: 0 11 * * * (see vercel.json)
 */

import { NextResponse } from "next/server";
import { runReengageRules } from "@/lib/reengage";
import { recordCronRun } from "@/lib/cron-run";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return true;
    return false;
  }
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = new URL(req.url);
  const q = url.searchParams.get("secret") || "";
  return bearer === secret || q === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReengageRules({ take: 150 });
    void recordCronRun("reengage", { ok: true, meta: result });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron reengage]", e);
    void recordCronRun("reengage", { ok: false, meta: { error: String(e) } });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
