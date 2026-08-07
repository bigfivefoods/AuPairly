import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Count ACTIVE listings matching saved-search filters (for UI preview). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || "";
  const country = searchParams.get("country")?.trim() || "";
  const target = searchParams.get("target") || "aupairs";
  const verified = searchParams.get("verified") === "1";

  const where = {
    status: "ACTIVE" as const,
    ...(verified ? { isVerified: true } : {}),
    ...(city
      ? {
          OR: [
            { city: { contains: city, mode: "insensitive" as const } },
            { city: { equals: city, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(country
      ? {
          OR: [
            { country: { contains: country, mode: "insensitive" as const } },
            { country: { equals: country, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const count =
    target === "families"
      ? await prisma.familyProfile.count({ where })
      : await prisma.auPairProfile.count({ where });

  return NextResponse.json({ count, target });
}
