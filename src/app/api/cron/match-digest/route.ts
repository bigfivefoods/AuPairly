/**
 * Weekly match digest cron.
 *
 * Auth: Authorization: Bearer CRON_SECRET  (or ?secret=)
 * Vercel Cron: see vercel.json crons entry.
 *
 * GET/POST /api/cron/match-digest
 */

import { NextResponse } from "next/server";
import { runWeeklyMatchDigests } from "@/lib/match-digest";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Allow in development without secret
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
    return NextResponse.json(
      {
        error:
          "Unauthorized. Set CRON_SECRET and pass Authorization: Bearer <secret>.",
      },
      { status: 401 }
    );
  }

  try {
    const stats = await runWeeklyMatchDigests();
    console.log("[cron match-digest]", stats);
    return NextResponse.json({
      ok: true,
      ...stats,
      note:
        "Emails send via Resend when RESEND_API_KEY is set; otherwise logged to console.",
    });
  } catch (e) {
    console.error("[cron match-digest]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Digest failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
