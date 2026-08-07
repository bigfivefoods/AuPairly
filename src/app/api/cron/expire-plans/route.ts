/**
 * Demote expired Plus/Premium members to Free (accounts stay active).
 *
 * Auth: Authorization: Bearer CRON_SECRET  (or ?secret=)
 * Vercel Cron: daily — see vercel.json
 *
 * GET/POST /api/cron/expire-plans
 */

import { NextResponse } from "next/server";
import { expireDuePaidPlans } from "@/lib/entitlements";

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
    return NextResponse.json(
      {
        error:
          "Unauthorized. Set CRON_SECRET and pass Authorization: Bearer <secret>.",
      },
      { status: 401 }
    );
  }

  try {
    const stats = await expireDuePaidPlans();
    console.log("[cron expire-plans]", stats);
    return NextResponse.json({
      ok: true,
      ...stats,
      note: "Expired paid periods demoted to FREE; accounts remain active.",
    });
  } catch (e) {
    console.error("[cron expire-plans]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "expire-plans failed" },
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
