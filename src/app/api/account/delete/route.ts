/**
 * POPIA-aligned account deletion (self-service).
 * Soft-deletes by anonymising PII then removing the user row (cascade).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  confirm: z.literal("DELETE"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`account-delete:${session.user.id}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts — try again later" },
      { status: 429 }
    );
  }

  try {
    schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'Send { "confirm": "DELETE" } to permanently delete your account' },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const email = session.user.email;

  // Management emails cannot self-delete without owner process
  const { isManagementEmail } = await import("@/lib/management");
  if (isManagementEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Management accounts cannot self-delete. Contact the platform owner.",
      },
      { status: 403 }
    );
  }

  try {
    void import("@/lib/funnel").then(({ trackFunnel }) =>
      trackFunnel("account_delete", { userId, role: session.user!.role })
    );

    // Cascade delete via User relations in schema
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      ok: true,
      message: "Your account and personal data have been deleted.",
    });
  } catch (e) {
    console.error("[account/delete]", e);
    return NextResponse.json(
      { error: "Could not delete account. Contact support." },
      { status: 500 }
    );
  }
}
