import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocale, LOCALE_COOKIE, LOCALES } from "@/lib/i18n/config";

const schema = z.object({
  locale: z.enum(LOCALES as unknown as [string, ...string[]]),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    if (!isLocale(body.locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const session = await auth();
    if (session?.user?.id) {
      await prisma.user
        .update({
          where: { id: session.user.id },
          data: { locale: body.locale },
        })
        .catch(() => null);
    }

    const res = NextResponse.json({ ok: true, locale: body.locale });
    res.cookies.set(LOCALE_COOKIE, body.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
