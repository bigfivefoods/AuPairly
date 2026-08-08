import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  city: z.string().min(1).max(80),
  country: z.string().max(80).optional(),
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || "";
  const country = searchParams.get("country")?.trim() || "";

  const hangouts = await prisma.cityHangout.findMany({
    where: {
      ...(city
        ? {
            OR: [
              { city: { equals: city, mode: "insensitive" } },
              { city: { contains: city, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(country
        ? {
            OR: [
              { country: { equals: country, mode: "insensitive" } },
              { country: { contains: country, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          aupairProfile: { select: { city: true, country: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({ hangouts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "AUPAIR" && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "City hangouts are for sitters" },
      { status: 403 }
    );
  }

  const rl = rateLimit(`hangout:${session.user.id}`, { limit: 10, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Hangout limit reached — try later" }, { status: 429 });
  }

  try {
    const body = createSchema.parse(await req.json());
    // Prefer author's profile location so hangouts stay tied to where they are based
    const profile = await prisma.auPairProfile.findUnique({
      where: { userId: session.user.id },
      select: { city: true, country: true },
    });
    const city =
      profile?.city?.trim() || body.city.trim() || "Anywhere";
    const country =
      profile?.country?.trim() || body.country?.trim() || null;

    const hangout = await prisma.cityHangout.create({
      data: {
        authorId: session.user.id,
        city,
        country,
        title: body.title.trim(),
        body: body.body.trim(),
      },
    });
    return NextResponse.json({ hangout }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid hangout post" }, { status: 400 });
    }
    console.error("hangout POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
