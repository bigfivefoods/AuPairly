import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/me
 * Current user profile fields for client avatars (always reads DB, not JWT cache).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      videoIntroUrl: true,
      videoIntroSeconds: true,
      videoIntroConfirmed: true,
      cvUrl: true,
      aupairProfile: {
        select: { city: true, country: true, status: true, headline: true },
      },
      familyProfile: {
        select: { city: true, country: true, status: true, headline: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      videoIntroUrl: user.videoIntroUrl,
      videoIntroSeconds: user.videoIntroSeconds,
      videoIntroConfirmed: user.videoIntroConfirmed,
      cvUrl: user.cvUrl,
      aupairProfile: user.aupairProfile,
      familyProfile: user.familyProfile,
    },
  });
}
